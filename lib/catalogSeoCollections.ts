export type SeoCollection = {
  id: string;
  title: string;
  h1: string;
  description: string;
  categoryNames: string[];
  isNew?: boolean;
};

export const seoCollections: SeoCollection[] = [
  {
    id: "roses",
    title: "Букеты из роз",
    h1: "Розы BellaFlore",
    description:
      "Красные, белые и авторские композиции из роз с доставкой по Москве и Московской области.",
    categoryNames: ["Розы"],
  },
  {
    id: "peonies",
    title: "Букеты с пионами",
    h1: "Пионы BellaFlore",
    description:
      "Сезонные пионы и авторские композиции в фирменной упаковке BellaFlore.",
    categoryNames: ["Пионы"],
  },
  {
    id: "hydrangeas",
    title: "Букеты с гортензиями",
    h1: "Гортензии BellaFlore",
    description:
      "Объёмные композиции с гортензиями для подарков, праздников и особенных моментов.",
    categoryNames: ["Гортензии"],
  },
  {
    id: "boxes",
    title: "Цветы в коробках",
    h1: "Композиции в коробках",
    description:
      "Премиальные цветочные коробки BellaFlore с аккуратной подачей и доставкой по адресу.",
    categoryNames: ["Коробки"],
  },
  {
    id: "baskets",
    title: "Цветы в корзинах",
    h1: "Композиции в корзинах",
    description:
      "Большие и камерные цветочные корзины для поздравлений и важных событий.",
    categoryNames: ["Корзины"],
  },
  {
    id: "compositions",
    title: "Авторские композиции",
    h1: "Цветочные композиции BellaFlore",
    description:
      "Выразительные композиции, собранные флористами BellaFlore в современном премиальном стиле.",
    categoryNames: ["Композиции"],
  },
  {
    id: "author",
    title: "Авторские букеты",
    h1: "Авторские букеты BellaFlore",
    description:
      "Авторские букеты с индивидуальной подачей, выразительной палитрой и фирменной упаковкой.",
    categoryNames: ["Авторские", "Авторские букеты"],
  },
  {
    id: "new",
    title: "Новинки",
    h1: "Новые композиции BellaFlore",
    description:
      "Свежие новинки каталога BellaFlore — новые сочетания, сезонные цветы и актуальные композиции.",
    categoryNames: [],
    isNew: true,
  },
];

export function getSeoCollection(id: string): SeoCollection | null {
  return seoCollections.find((collection) => collection.id === id) ?? null;
}
