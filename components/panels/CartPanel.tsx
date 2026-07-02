// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Оформление заказа
//
// Purpose (EN):
// Slide-out cart panel with items and checkout CTA
//
// Назначение (RU):
// Панель корзины с позициями и оформлением
// ==================================================
"use client";

import Image from "next/image";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type CartPanelBouquet = {
  id: string;
  src: string;
  alt: string;
  title: string;
  priceRub: number;
  width: number;
  height: number;
};

type CartPanelItem = {
  bouquet: CartPanelBouquet;
  sizeId: ProductSizeId;
  sizeLabel: string;
  quantity: number;
};

type CartPanelProps = {
  cartBouquets: CartPanelItem[];
  cartItemCount: number;
  checkoutTotalPrice: number;
  formatPrice: (priceRub: number) => string;
  closeCartPanel: () => void;
  handleCartDecreaseClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => void;
  handleCartDecreaseTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => void;
  handleCartIncreaseClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => void;
  handleCartIncreaseTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => void;
  handleCartRemoveClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => void;
  handleCartRemoveTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => void;
  handleCheckoutClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleCheckoutTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
};

export function CartPanel({
  cartBouquets,
  cartItemCount,
  checkoutTotalPrice,
  formatPrice,
  closeCartPanel,
  handleCartDecreaseClick,
  handleCartDecreaseTouchEnd,
  handleCartIncreaseClick,
  handleCartIncreaseTouchEnd,
  handleCartRemoveClick,
  handleCartRemoveTouchEnd,
  handleCheckoutClick,
  handleCheckoutTouchEnd,
}: CartPanelProps) {
  return (
    <div
      className="cart-panel-overlay"
      role="presentation"
      onClick={closeCartPanel}
    >
      {/* ==================================================
SECTION: CHECKOUT
РАЗДЕЛ: Диалог корзины с позициями и итогами
Purpose (EN): Cart dialog with items and summary
Назначение (RU): Диалог корзины с позициями и итогами
================================================== */}
      <aside
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-panel-header">
          <div>
            <BrandLogo variant="panel" className="cart-panel-eyebrow" />
            <h2 id="cart-panel-title">Корзина</h2>
          </div>
          <div className="cart-panel-actions">
            {cartItemCount > 0 && (
              <span className="cart-count-badge" aria-hidden="true">
                {cartItemCount}
              </span>
            )}
            <button
              type="button"
              className="cart-panel-close"
              onClick={closeCartPanel}
              aria-label="Закрыть корзину"
            >
              ×
            </button>
          </div>
        </div>

        {cartBouquets.length === 0 ? (
          <p className="cart-empty">Ваша корзина пока пуста</p>
        ) : (
          <>
            <div className="cart-panel-list">
              {cartBouquets.map((cartItem) => (
                <article
                  className="cart-panel-item"
                  key={`cart-${cartItem.bouquet.id}-${cartItem.sizeId}`}
                >
                  <div className="cart-panel-image">
                    <Image
                      src={cartItem.bouquet.src}
                      alt={cartItem.bouquet.alt}
                      width={cartItem.bouquet.width}
                      height={cartItem.bouquet.height}
                      sizes="(max-width: 768px) 34vw, 132px"
                      unoptimized={shouldUseUnoptimizedImage(cartItem.bouquet.src)}
                    />
                  </div>
                  <div className="cart-panel-item-info">
                    <div className="cart-panel-item-heading">
                      <h3>{cartItem.bouquet.title}</h3>
                      <p>
                        Размер {cartItem.sizeLabel} · {formatPrice(cartItem.bouquet.priceRub)}
                      </p>
                    </div>
                    <div className="cart-panel-quantity-block">
                      <span>Количество</span>
                      <div className="cart-quantity-controls">
                        <button
                          type="button"
                          onClick={(event) =>
                          handleCartDecreaseClick(
                              event,
                              cartItem.bouquet.id,
                              cartItem.sizeId,
                            )
                          }
                          onTouchEnd={(event) =>
                            handleCartDecreaseTouchEnd(
                              event,
                              cartItem.bouquet.id,
                              cartItem.sizeId,
                            )
                          }
                          aria-label={`Уменьшить количество ${cartItem.bouquet.title}`}
                        >
                          −
                        </button>
                        <span aria-label={`Количество ${cartItem.quantity}`}>
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(event) =>
                          handleCartIncreaseClick(
                              event,
                              cartItem.bouquet.id,
                              cartItem.sizeId,
                            )
                          }
                          onTouchEnd={(event) =>
                            handleCartIncreaseTouchEnd(
                              event,
                              cartItem.bouquet.id,
                              cartItem.sizeId,
                            )
                          }
                          aria-label={`Увеличить количество ${cartItem.bouquet.title}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="cart-panel-item-total">
                      Итого:{" "}
                      <strong>
                        {formatPrice(
                          cartItem.bouquet.priceRub * cartItem.quantity,
                        )}
                      </strong>
                    </p>
                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={(event) =>
                        handleCartRemoveClick(
                          event,
                          cartItem.bouquet.id,
                          cartItem.sizeId,
                        )
                      }
                      onTouchEnd={(event) =>
                        handleCartRemoveTouchEnd(
                          event,
                          cartItem.bouquet.id,
                          cartItem.sizeId,
                        )
                      }
                      aria-label={`Удалить ${cartItem.bouquet.title} из корзины`}
                    >
                      Убрать
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-panel-summary">
              {/* ==================================================
SECTION: ORDER SUMMARY
РАЗДЕЛ: Итоги и кнопка оформления
Purpose (EN): Totals and checkout button
Назначение (RU): Итоги и кнопка оформления
================================================== */}
              <div>
                <span>Сумма заказа</span>
                <strong>{formatPrice(checkoutTotalPrice)}</strong>
              </div>
              <button
                type="button"
                className="buy-button cart-checkout-button"
                onClick={handleCheckoutClick}
                onTouchEnd={handleCheckoutTouchEnd}
              >
                Оформить заказ
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
