// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Smart checkout — сбор комментария
//
// Purpose (EN): Compose order comment from smart checkout UI fields.
//
// Назначение (RU): Сбор комментария из полей smart checkout.
// ==================================================
type ComposeSmartCheckoutCommentInput = {
  orderComment: string;
  isOtherRecipient: boolean;
  recipientName: string;
  recipientPhone: string;
  courierComment: string;
  anonymousDelivery: boolean;
};

export function composeSmartCheckoutComment({
  orderComment,
  isOtherRecipient,
  recipientName,
  recipientPhone,
  courierComment,
  anonymousDelivery,
}: ComposeSmartCheckoutCommentInput): string {
  const blocks: string[] = [];

  if (anonymousDelivery) {
    blocks.push("Анонимная доставка: получатель не увидит информацию об отправителе.");
  }

  if (isOtherRecipient) {
    const recipientParts = [
      recipientName.trim() && `Получатель: ${recipientName.trim()}`,
      recipientPhone.trim() && `Телефон получателя: ${recipientPhone.trim()}`,
      courierComment.trim() && `Комментарий курьеру: ${courierComment.trim()}`,
    ].filter(Boolean);

    if (recipientParts.length > 0) {
      blocks.push(recipientParts.join("\n"));
    }
  }

  const trimmedOrderComment = orderComment.trim();
  if (trimmedOrderComment) {
    blocks.push(trimmedOrderComment);
  }

  return blocks.join("\n\n");
}
