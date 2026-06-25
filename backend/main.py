from __future__ import annotations

import json
import logging
import os
import sqlite3
from pathlib import Path
from typing import Any, Optional

import requests
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DATABASE_PATH = BASE_DIR / "bellaflore.db"
logger = logging.getLogger("bellaflore.backend")
ORDER_STATUSES = {
    "NEW",
    "CONFIRMED",
    "PREPARING",
    "COURIER_ASSIGNED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
}
PAYMENT_STATUSES = {"PENDING", "PAID", "REFUNDED"}
ORDER_STATUS_LABELS = {
    "NEW": "Новый заказ",
    "CONFIRMED": "Заказ подтверждён",
    "PREPARING": "Букет собирается",
    "COURIER_ASSIGNED": "Курьер назначен",
    "OUT_FOR_DELIVERY": "Курьер в пути",
    "DELIVERED": "Доставлен",
    "CANCELLED": "Отменён",
}
PAYMENT_STATUS_LABELS = {
    "PENDING": "Ожидает оплаты",
    "PAID": "Оплачено",
    "REFUNDED": "Возврат выполнен",
}
DEFAULT_ADMIN_URL = "http://127.0.0.1:3000/admin"
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]


def get_cors_origins() -> list[str]:
    env_values = dotenv_values(BASE_DIR / ".env")
    configured_origins = (
        env_values.get("CORS_ORIGINS") or os.getenv("CORS_ORIGINS") or ""
    ).strip()
    extra_origins = [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    return list(dict.fromkeys(DEFAULT_CORS_ORIGINS + extra_origins))


app = FastAPI(title="Bellaflore Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


class OrderCreate(BaseModel):
    order_id: str
    customer_name: str
    customer_phone: str
    comment: str = ""
    items: list[dict[str, Any]] = Field(default_factory=list)
    total_price: int
    payment_method: str
    payment_status: str = "PENDING"
    payment_proof_file_name: Optional[str] = None
    order_status: str = "NEW"
    created_at: str


class OrderStatusUpdate(BaseModel):
    order_status: str


class PaymentStatusUpdate(BaseModel):
    payment_status: str


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                comment TEXT NOT NULL DEFAULT '',
                items TEXT NOT NULL,
                total_price INTEGER NOT NULL,
                payment_method TEXT NOT NULL,
                payment_status TEXT NOT NULL,
                payment_proof_file_name TEXT,
                order_status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def row_to_order(row: sqlite3.Row) -> dict[str, Any]:
    order = dict(row)
    order["items"] = json.loads(order["items"])
    return order


def validate_order_status(order_status: str) -> None:
    if order_status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid order status")


def validate_payment_status(payment_status: str) -> None:
    if payment_status not in PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid payment status")


def format_price_rub(price: int) -> str:
    return f"{price:,}".replace(",", " ") + " ₽"


def get_admin_url() -> str:
    env_values = dotenv_values(BASE_DIR / ".env")
    return (
        env_values.get("BELLAFLORE_ADMIN_URL")
        or os.getenv("BELLAFLORE_ADMIN_URL")
        or DEFAULT_ADMIN_URL
    ).strip()


def get_safe_exception_detail(error: Exception) -> str:
    if isinstance(error, HTTPException):
        return f"HTTPException {error.status_code}: {error.detail}"

    return error.__class__.__name__


def build_telegram_order_message(order: dict[str, Any]) -> str:
    payment_status = PAYMENT_STATUS_LABELS.get(
        order["payment_status"],
        order["payment_status"],
    )
    order_status = ORDER_STATUS_LABELS.get(
        order["order_status"],
        order["order_status"],
    )

    return "\n".join(
        [
            "🌸 Новый заказ Bellaflore",
            "",
            f"Заказ: {order['order_id']}",
            f"Клиент: {order['customer_name']}",
            f"Телефон: {order['customer_phone']}",
            f"Сумма: {format_price_rub(order['total_price'])}",
            f"Оплата: {order['payment_method']}",
            f"Статус оплаты: {payment_status}",
            f"Статус заказа: {order_status}",
            f"Создан: {order['created_at']}",
            f"Админка: {get_admin_url()}",
        ]
    )


def get_telegram_config() -> tuple[str, str]:
    env_values = dotenv_values(BASE_DIR / ".env")
    bot_token = (
        env_values.get("TELEGRAM_BOT_TOKEN")
        or os.getenv("TELEGRAM_BOT_TOKEN")
        or ""
    ).strip()
    chat_id = (
        env_values.get("TELEGRAM_CHAT_ID")
        or os.getenv("TELEGRAM_CHAT_ID")
        or ""
    ).strip()

    return bot_token, chat_id


def send_telegram_message(text: str, chat_id: Optional[str] = None) -> None:
    bot_token, configured_chat_id = get_telegram_config()
    target_chat_id = (chat_id or configured_chat_id).strip()

    if not bot_token:
        raise HTTPException(
            status_code=500,
            detail="TELEGRAM_BOT_TOKEN is not configured",
        )

    if not target_chat_id:
        raise HTTPException(
            status_code=500,
            detail="TELEGRAM_CHAT_ID is not configured",
        )

    try:
        response = requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={
                "chat_id": target_chat_id,
                "text": text,
            },
            timeout=5,
        )
        result = response.json()
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Telegram sendMessage request failed",
        ) from error

    if response.status_code != 200 or not result.get("ok"):
        telegram_detail = result.get("description", "Unknown Telegram error")
        raise HTTPException(
            status_code=502,
            detail=f"Telegram sendMessage returned an error: {telegram_detail}",
        )


def send_telegram_order_notification(order: dict[str, Any]) -> None:
    bot_token, chat_id = get_telegram_config()

    if not bot_token or not chat_id:
        return

    try:
        send_telegram_message(build_telegram_order_message(order), chat_id)
    except Exception as error:
        logger.warning(
            "Telegram notification failed for order %s: %s",
            order.get("order_id"),
            get_safe_exception_detail(error),
        )


def get_telegram_chat_from_updates() -> dict[str, Any]:
    env_values = dotenv_values(BASE_DIR / ".env")
    bot_token = (
        env_values.get("TELEGRAM_BOT_TOKEN")
        or os.getenv("TELEGRAM_BOT_TOKEN")
        or ""
    ).strip()

    if not bot_token:
        raise HTTPException(
            status_code=500,
            detail="TELEGRAM_BOT_TOKEN is not configured",
        )

    try:
        response = requests.get(
            f"https://api.telegram.org/bot{bot_token}/getUpdates",
            timeout=5,
        )
        updates = response.json()
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="Telegram getUpdates request failed",
        ) from error

    if response.status_code != 200 or not updates.get("ok"):
        telegram_detail = updates.get("description", "Unknown Telegram error")
        raise HTTPException(
            status_code=502,
            detail=f"Telegram getUpdates returned an error: {telegram_detail}",
        )

    for update in reversed(updates.get("result", [])):
        message = (
            update.get("message")
            or update.get("edited_message")
            or update.get("channel_post")
            or update.get("edited_channel_post")
            or update.get("callback_query", {}).get("message")
            or {}
        )
        chat = message.get("chat")

        if chat:
            return {
                "chat_id": chat.get("id"),
                "username": chat.get("username", ""),
                "first_name": chat.get("first_name", ""),
            }

    raise HTTPException(
        status_code=404,
        detail="No Telegram chat found. Send a message to the bot first.",
    )


@app.on_event("startup")
def on_startup() -> None:
    init_database()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "Bellaflore backend running"}


@app.get("/telegram/chat-id")
def read_telegram_chat_id() -> dict[str, Any]:
    return get_telegram_chat_from_updates()


@app.post("/telegram/test")
def send_telegram_test_notification() -> dict[str, bool]:
    send_telegram_message(
        "\n".join(
            [
                "🔔 Bellaflore Test Notification",
                "",
                "Telegram integration is working.",
            ]
        )
    )

    return {"success": True}


@app.post("/orders", status_code=201)
def create_order(order: OrderCreate) -> dict[str, Any]:
    init_database()
    validate_order_status(order.order_status)
    validate_payment_status(order.payment_status)

    try:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO orders (
                    order_id,
                    customer_name,
                    customer_phone,
                    comment,
                    items,
                    total_price,
                    payment_method,
                    payment_status,
                    payment_proof_file_name,
                    order_status,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    order.order_id,
                    order.customer_name,
                    order.customer_phone,
                    order.comment,
                    json.dumps(order.items, ensure_ascii=False),
                    order.total_price,
                    order.payment_method,
                    order.payment_status,
                    order.payment_proof_file_name,
                    order.order_status,
                    order.created_at,
                ),
            )
    except sqlite3.IntegrityError as error:
        raise HTTPException(
            status_code=409,
            detail=f"Order {order.order_id} already exists",
        ) from error

    created_order = get_order(order.order_id)
    send_telegram_order_notification(created_order)

    return created_order


@app.get("/orders")
def list_orders() -> list[dict[str, Any]]:
    init_database()

    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM orders ORDER BY created_at DESC"
        ).fetchall()

    return [row_to_order(row) for row in rows]


@app.get("/orders/{order_id}")
def get_order(order_id: str) -> dict[str, Any]:
    init_database()

    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM orders WHERE order_id = ?",
            (order_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Order not found")

    return row_to_order(row)


@app.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
) -> dict[str, Any]:
    init_database()
    validate_order_status(status_update.order_status)

    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE orders SET order_status = ? WHERE order_id = ?",
            (status_update.order_status, order_id),
        )

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return get_order(order_id)


@app.patch("/orders/{order_id}/payment-status")
def update_payment_status(
    order_id: str,
    status_update: PaymentStatusUpdate,
) -> dict[str, Any]:
    init_database()
    validate_payment_status(status_update.payment_status)

    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE orders SET payment_status = ? WHERE order_id = ?",
            (status_update.payment_status, order_id),
        )

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return get_order(order_id)
