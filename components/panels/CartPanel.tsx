"use client";

import Image from "next/image";
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
  ) => void;
  handleCartDecreaseTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleCartIncreaseClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleCartIncreaseTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleCartRemoveClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleCartRemoveTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
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
      <aside
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-panel-header">
          <div>
            <span className="cart-panel-eyebrow">Bellaflore</span>
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
                  key={`cart-${cartItem.bouquet.id}`}
                >
                  <div className="cart-panel-image">
                    <Image
                      src={cartItem.bouquet.src}
                      alt={cartItem.bouquet.alt}
                      width={cartItem.bouquet.width}
                      height={cartItem.bouquet.height}
                      sizes="(max-width: 768px) 34vw, 132px"
                    />
                  </div>
                  <div className="cart-panel-item-info">
                    <div className="cart-panel-item-heading">
                      <h3>{cartItem.bouquet.title}</h3>
                      <p>{formatPrice(cartItem.bouquet.priceRub)}</p>
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
                            )
                          }
                          onTouchEnd={(event) =>
                            handleCartDecreaseTouchEnd(
                              event,
                              cartItem.bouquet.id,
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
                            )
                          }
                          onTouchEnd={(event) =>
                            handleCartIncreaseTouchEnd(
                              event,
                              cartItem.bouquet.id,
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
                        handleCartRemoveClick(event, cartItem.bouquet.id)
                      }
                      onTouchEnd={(event) =>
                        handleCartRemoveTouchEnd(
                          event,
                          cartItem.bouquet.id,
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
