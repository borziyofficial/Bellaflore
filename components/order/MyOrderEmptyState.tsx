type MyOrderEmptyStateProps = {
  onCloseMyOrderPanel: () => void;
};

export function MyOrderEmptyState({
  onCloseMyOrderPanel,
}: MyOrderEmptyStateProps) {
  return (
    <div className="my-order-empty-card">
      <span className="my-order-empty-mark" aria-hidden="true">
        BF
      </span>
      <p>У вас пока нет заказов</p>
      <a
        className="buy-button my-order-empty-button"
        href="#collections"
        onClick={onCloseMyOrderPanel}
      >
        Перейти к букетам
      </a>
    </div>
  );
}
