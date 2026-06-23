export type SmartCatalogItemStatus = "live" | "draft" | "robot-suggested";

export type SmartCatalogItem = {
  id: string;
  label: string;
  query: string;
  status: SmartCatalogItemStatus;
  robotSignals?: string[];
};

export type SmartCatalogSection = {
  id: string;
  title: string;
  items: SmartCatalogItem[];
};

export type SmartCatalogGroup = {
  id: string;
  title: string;
  description: string;
  adminManaged: boolean;
  robotReady: boolean;
  sections: SmartCatalogSection[];
};

const item = (
  groupId: string,
  sectionId: string,
  label: string,
  query = label,
  status: SmartCatalogItemStatus = "live",
): SmartCatalogItem => ({
  id: `${groupId}-${sectionId}-${query.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/gi, "-").replace(/(^-|-$)/g, "")}`,
  label,
  query,
  status,
});

export const smartCatalogGroups: SmartCatalogGroup[] = [
  {
    id: "roses",
    title: "Розы",
    description: "Цвет, количество и премиальный формат",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "color",
        title: "По цвету",
        items: [
          item("roses", "color", "Красные розы"),
          item("roses", "color", "Белые розы"),
          item("roses", "color", "Розовые розы"),
          item("roses", "color", "Кремовые розы"),
          item("roses", "color", "Кустовые розы"),
        ],
      },
      {
        id: "quantity",
        title: "По количеству",
        items: [
          item("roses", "quantity", "7 роз"),
          item("roses", "quantity", "9 роз"),
          item("roses", "quantity", "13 роз"),
          item("roses", "quantity", "19 роз"),
          item("roses", "quantity", "25 роз"),
          item("roses", "quantity", "33 розы"),
          item("roses", "quantity", "39 роз"),
          item("roses", "quantity", "51 роза"),
          item("roses", "quantity", "101 роза"),
        ],
      },
      {
        id: "format",
        title: "Формат",
        items: [
          item("roses", "format", "Розы в коробке"),
          item("roses", "format", "Розы в корзине"),
          item("roses", "format", "Французский стиль", "Французский стиль розы"),
        ],
      },
    ],
  },
  {
    id: "peonies",
    title: "Пионы",
    description: "Сезонные оттенки, формат и количество",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "color",
        title: "По цвету",
        items: [
          item("peonies", "color", "Белые пионы"),
          item("peonies", "color", "Розовые пионы"),
          item("peonies", "color", "Красные пионы"),
          item("peonies", "color", "Коралловые пионы"),
        ],
      },
      {
        id: "quantity",
        title: "По количеству",
        items: [
          item("peonies", "quantity", "9 пионов"),
          item("peonies", "quantity", "15 пионов"),
          item("peonies", "quantity", "19 пионов"),
          item("peonies", "quantity", "25 пионов"),
          item("peonies", "quantity", "35 пионов"),
          item("peonies", "quantity", "51 пион"),
          item("peonies", "quantity", "101 пион"),
        ],
      },
      {
        id: "format",
        title: "Формат",
        items: [
          item("peonies", "format", "Пионы в коробке"),
          item("peonies", "format", "Пионы в корзине"),
          item("peonies", "format", "Французский стиль", "Французский стиль пионы"),
        ],
      },
    ],
  },
  {
    id: "hydrangeas",
    title: "Гортензии",
    description: "Воздушные букеты и французская сборка",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "quantity",
        title: "По количеству",
        items: [
          item("hydrangeas", "quantity", "3 гортензии"),
          item("hydrangeas", "quantity", "5 гортензий"),
          item("hydrangeas", "quantity", "7 гортензий"),
          item("hydrangeas", "quantity", "9 гортензий"),
          item("hydrangeas", "quantity", "15 гортензий"),
        ],
      },
      {
        id: "format",
        title: "Формат",
        items: [
          item("hydrangeas", "format", "Гортензии микс"),
          item("hydrangeas", "format", "Французский стиль", "Французский стиль гортензии"),
        ],
      },
    ],
  },
  {
    id: "tulips",
    title: "Тюльпаны",
    description: "Весенние объемы и оттенки",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "quantity",
        title: "По количеству",
        items: [
          item("tulips", "quantity", "15 тюльпанов"),
          item("tulips", "quantity", "25 тюльпанов"),
          item("tulips", "quantity", "35 тюльпанов"),
          item("tulips", "quantity", "51 тюльпан"),
          item("tulips", "quantity", "101 тюльпан"),
        ],
      },
      {
        id: "color",
        title: "По цвету",
        items: [
          item("tulips", "color", "Белые", "Белые тюльпаны"),
          item("tulips", "color", "Розовые", "Розовые тюльпаны"),
          item("tulips", "color", "Красные", "Красные тюльпаны"),
          item("tulips", "color", "Микс", "Тюльпаны микс"),
        ],
      },
    ],
  },
  {
    id: "mono",
    title: "Моно-букеты",
    description: "Один цветок, чистый акцент",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "flowers",
        title: "Цветы",
        items: [
          item("mono", "flowers", "Моно-букет из роз", "розы"),
          item("mono", "flowers", "Моно-букет из пионов", "пионы"),
          item("mono", "flowers", "Моно-букет из гортензий", "гортензии"),
          item("mono", "flowers", "Моно-букет из тюльпанов", "тюльпаны"),
        ],
      },
    ],
  },
  {
    id: "mix",
    title: "Микс-букеты",
    description: "Сложные сочетания Bellaflore",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "style",
        title: "Стиль",
        items: [
          item("mix", "style", "Нежный микс", "микс букет нежный"),
          item("mix", "style", "Яркий микс", "микс букет яркий"),
          item("mix", "style", "Премиальный микс", "премиальный микс букет"),
        ],
      },
    ],
  },
  {
    id: "baskets",
    title: "Корзины",
    description: "Подарочный формат с объемом",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "format",
        title: "Формат",
        items: [
          item("baskets", "format", "Розы в корзине"),
          item("baskets", "format", "Пионы в корзине"),
          item("baskets", "format", "Гортензии в корзине"),
          item("baskets", "format", "Микс в корзине"),
        ],
      },
    ],
  },
  {
    id: "boxes",
    title: "Коробки",
    description: "Компактный премиальный подарок",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "format",
        title: "Формат",
        items: [
          item("boxes", "format", "Розы в коробке"),
          item("boxes", "format", "Пионы в коробке"),
          item("boxes", "format", "Гортензии в коробке"),
          item("boxes", "format", "Микс в коробке"),
        ],
      },
    ],
  },
  {
    id: "french-style",
    title: "Французский стиль",
    description: "Легкая сборка с воздухом и ритмом",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "roses",
        title: "Розы",
        items: [
          item("french-style", "roses", "5 роз", "Французский стиль 5 роз"),
          item("french-style", "roses", "7 роз", "Французский стиль 7 роз"),
          item("french-style", "roses", "9 роз", "Французский стиль 9 роз"),
          item("french-style", "roses", "15 роз", "Французский стиль 15 роз"),
          item("french-style", "roses", "19 роз", "Французский стиль 19 роз"),
          item("french-style", "roses", "31 роза", "Французский стиль 31 роза"),
        ],
      },
      {
        id: "peonies",
        title: "Пионы",
        items: [
          item("french-style", "peonies", "5 пионов", "Французский стиль 5 пионов"),
          item("french-style", "peonies", "7 пионов", "Французский стиль 7 пионов"),
          item("french-style", "peonies", "9 пионов", "Французский стиль 9 пионов"),
          item("french-style", "peonies", "15 пионов", "Французский стиль 15 пионов"),
          item("french-style", "peonies", "19 пионов", "Французский стиль 19 пионов"),
        ],
      },
    ],
  },
  {
    id: "occasions",
    title: "Поводы",
    description: "Подбор по ситуации",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "occasion",
        title: "Повод",
        items: [
          item("occasions", "occasion", "День рождения"),
          item("occasions", "occasion", "Юбилей"),
          item("occasions", "occasion", "Свадьба"),
          item("occasions", "occasion", "Свидание"),
          item("occasions", "occasion", "Спасибо"),
          item("occasions", "occasion", "Извинение"),
          item("occasions", "occasion", "Выписка из роддома"),
          item("occasions", "occasion", "Для мамы"),
          item("occasions", "occasion", "Для любимой"),
        ],
      },
    ],
  },
  {
    id: "recipients",
    title: "Кому",
    description: "Адресный выбор букета",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "recipient",
        title: "Получатель",
        items: [
          item("recipients", "recipient", "Любимой"),
          item("recipients", "recipient", "Маме"),
          item("recipients", "recipient", "Жене"),
          item("recipients", "recipient", "Подруге"),
          item("recipients", "recipient", "Коллеге"),
          item("recipients", "recipient", "Невесте"),
        ],
      },
    ],
  },
  {
    id: "offers",
    title: "Акции",
    description: "Будущие подборки и сезонные предложения",
    adminManaged: true,
    robotReady: true,
    sections: [
      {
        id: "offers",
        title: "Подборки",
        items: [
          item("offers", "offers", "Букеты недели", "акции букеты недели", "draft"),
          item("offers", "offers", "Сезонные предложения", "акции сезонные букеты", "draft"),
          item("offers", "offers", "Подарочный комплимент", "акции подарок", "draft"),
        ],
      },
    ],
  },
];
