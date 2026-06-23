# Bellaflore Backend

Independent FastAPI backend foundation for Bellaflore orders.

Orders are stored locally in SQLite at:

```text
backend/bellaflore.db
```

## Setup

Create a virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

Install requirements:

```bash
pip install -r requirements.txt
```

## Telegram Notifications

Telegram notifications are sent from the backend after `POST /orders`
successfully saves a new order in SQLite.

Create a Telegram bot with BotFather, then paste the token into:

```text
backend/.env
```

Paste the token exactly here:

```env
TELEGRAM_BOT_TOKEN=paste_your_bot_token_here
```

Replace `paste_your_bot_token_here` with the token from BotFather.

You can also set the same value as an environment variable:

```bash
export TELEGRAM_BOT_TOKEN="123456789:your-bot-token"
export TELEGRAM_CHAT_ID="123456789"
```

To find your chat id, send a message to your bot and use Telegram's
`getUpdates` endpoint, or use a trusted chat-id helper bot.

If `TELEGRAM_CHAT_ID` is missing, use the temporary diagnostic endpoint after
sending a message to the bot:

```text
http://127.0.0.1:8000/telegram/chat-id
```

Then paste the returned `chat_id` into `backend/.env`:

```env
TELEGRAM_CHAT_ID=123456789
```

If either value is missing, the backend still creates orders normally and skips
Telegram sending.

Run the backend:

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

For MacBook and iPhone LAN testing, run:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

With Telegram notifications enabled:

```bash
export TELEGRAM_BOT_TOKEN="123456789:your-bot-token"
export TELEGRAM_CHAT_ID="123456789"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /` - health check
- `POST /orders` - create an order
- `GET /orders` - list all orders
- `GET /orders/{order_id}` - get one order
- `PATCH /orders/{order_id}/status` - update order status
- `PATCH /orders/{order_id}/payment-status` - update payment status

## Example Order

```json
{
  "order_id": "BF-1001",
  "customer_name": "Анна",
  "customer_phone": "+7 999 000-00-00",
  "comment": "Позвонить перед доставкой",
  "items": [
    {
      "bouquetId": "red-luxury",
      "bouquetName": "Red Luxury",
      "quantity": 1,
      "priceRub": 14900,
      "lineTotalRub": 14900
    }
  ],
  "total_price": 14900,
  "payment_method": "Перевод на карту / СБП — рекомендуется",
  "payment_status": "PENDING",
  "payment_proof_file_name": null,
  "order_status": "NEW",
  "created_at": "2026-06-14T12:00:00.000Z"
}
```
