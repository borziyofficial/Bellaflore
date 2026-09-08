#!/usr/bin/env node
/**
 * One-off production catalog fill — uses ADMIN_USERNAME/ADMIN_PASSWORD from .env.vercel.local
 * Does NOT print credentials. Skips errors and continues.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://www.bellaflore.ru";
const MANIFEST = "/tmp/bf_remaining_photos.json";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT, ".env.vercel.local"));
loadEnvFile(path.join(ROOT, ".env.local"));

const user = process.env.ADMIN_USERNAME?.trim();
const pass = process.env.ADMIN_PASSWORD?.trim();

function slugify(title) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return [...title.toLowerCase()]
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priceAt(i) {
  const seq = [
    1112, 1122, 1133, 1144, 1155, 1166, 1177, 1188, 1199, 1211, 1222, 1233, 1244,
    1255, 1266, 1277, 1288, 1299, 1311, 1322, 1333, 1344, 1355, 1366, 1377, 1388,
    1399, 1411, 1422, 1433, 1444, 1455, 1466, 1477, 1488, 1499, 1511, 1522, 1533,
    1544, 1555, 1566, 1577, 1588, 1599, 1611, 1622, 1633, 1644, 1655, 1666, 1677,
    1688, 1699, 1711, 1722, 1733, 1744, 1755, 1766, 1777, 1788, 1799, 1811, 1822,
    1833, 1844, 1855,
  ];
  return seq[i] ?? 1112 + i * 11;
}

const NAMES = [
  ["Утренний шёпот", "author", "Утренний шёпот — нежная авторская композиция для особого настроения.", "Свежие сезонные цветы в премиальной подаче Bellaflore. Идеален для подарка без повода."],
  ["Серебряная роса", "roses", "Серебряная роса — букет с холодной элегантностью и мягким сиянием.", "Собран вручную флористами Bellaflore. Лаконичная форма и ощущение утренней свежести."],
  ["Медовый аккорд", "mono-bouquets", "Медовый аккорд — тёплый монобукет с бархатной глубиной оттенков.", "Премиальная подача, стойкие сортовые цветы и аккуратная упаковка Bellaflore."],
  ["Лиловый рассвет", "peonies", "Лиловый рассвет — воздушная композиция с мягкими пастельными переходами.", "Bellaflore собирает букеты, которые выглядят дорого и естественно."],
  ["Императорский бархат", "roses", "Императорский бархат — насыщенный букет для яркого и уверенного подарка.", "Глубокие оттенки, плотная фактура и выразительный силуэт."],
  ["Нежный каскад", "author", "Нежный каскад — авторская композиция с плавным движением линий.", "Изящный букет с ощущением лёгкости и утончённости."],
  ["Кремовая симфония", "mono-bouquets", "Кремовая симфония — светлый букет в духе quiet luxury.", "Нейтральная палитра, чистая форма и тактильная роскошь."],
  ["Рубиновый шёлк", "roses", "Рубиновый шёлк — страстный букет с благородным блеском лепестков.", "Сочный цвет, плотная сборка и фирменная подача Bellaflore."],
  ["Садовая мечта", "author", "Садовая мечта — живая композиция с ощущением летнего сада.", "Натуральная фактура, мягкие переходы и свежий аромат."],
  ["Жемчужная лагуна", "hydrangeas", "Жемчужная лагуна — объёмная композиция с воздушной текстурой.", "Пышный силуэт и спокойная палитра с доставкой по Москве."],
  ["Алый импульс", "roses", "Алый импульс — выразительный букет для смелого романтического жеста.", "Яркий акцент, чистая геометрия и премиальная упаковка."],
  ["Тихая роскошь", "vip", "Тихая роскошь — сдержанная VIP-композиция для особых случаев.", "Минимум деталей, максимум качества от Bellaflore."],
  ["Сиреневый туман", "peonies", "Сиреневый туман — нежный букет с мягким свечением оттенков.", "Лёгкая, воздушная подача и тактильная нежность."],
  ["Золотой час", "author", "Золотой час — букет, созданный для самых тёплых моментов дня.", "Солнечная палитра, премиальные цветы и аккуратная сборка."],
  ["Белый омут", "mono-bouquets", "Белый омут — чистый монобукет с ощущением свежести и спокойствия.", "Светлые оттенки, безупречная форма и стойкость."],
  ["Малахитовый блеск", "author", "Малахитовый блеск — глубокая авторская композиция с насыщенной фактурой.", "Богатые оттенки и выразительный объём."],
  ["Персиковый закат", "author", "Персиковый закат — мягкий букет с тёплым послеобеденным светом.", "Нежные переходы цвета и лёгкая романтика."],
  ["Лунная дорожка", "author", "Лунная дорожка — таинственная композиция с холодным сиянием.", "Утончённая палитра и чистые линии."],
  ["Вишнёвый соблазн", "roses", "Вишнёвый соблазн — насыщенный букет с глубоким характером.", "Смелый цвет, плотная сборка и стойкость."],
  ["Морская пена", "hydrangeas", "Морская пена — свежая композиция с прохладными оттенками.", "Воздушный объём и спокойная эстетика."],
  ["Шампанское утро", "author", "Шампанское утро — букет с мягким блеском и праздничным настроением.", "Светлые тона и безупречная свежесть."],
  ["Бордовый вельвет", "roses", "Бордовый вельвет — благородный букет с бархатной глубиной.", "Насыщенная палитра и выразительный силуэт."],
  ["Пудровая нежность", "peonies", "Пудровая нежность — романтичный букет в пастельной гамме.", "Мягкие оттенки, воздушная форма и тактильная роскошь."],
  ["Ивовый ветер", "author", "Ивовый ветер — лёгкая композиция с естественным движением.", "Органичная форма и свежая фактура."],
  ["Карамельный свет", "mono-bouquets", "Карамельный свет — тёплый монобукет с уютным характером.", "Мягкая палитра и аккуратная сборка."],
  ["Сапфировая ночь", "author", "Сапфировая ночь — глубокая композиция с вечерним настроением.", "Контрастные оттенки и выразительный объём."],
  ["Мятная свежесть", "author", "Мятная свежесть — букет с ощущением прохлады и лёгкости.", "Чистые линии и фирменная упаковка Bellaflore."],
  ["Розовый кристалл", "roses", "Розовый кристалл — сияющий букет с нежным блеском лепестков.", "Изящная форма и романтичная палитра."],
  ["Тёплый плед", "author", "Тёплый плед — уютная композиция с домашним настроением.", "Мягкие оттенки и натуральная фактура."],
  ["Лазурный бриз", "hydrangeas", "Лазурный бриз — воздушный букет с прохладной палитрой.", "Объёмная форма и спокойная эстетика."],
  ["Королевский акцент", "vip", "Королевский акцент — статусная композиция для особого случая.", "Премиальные цветы и безупречная сборка."],
  ["Сливочная нега", "mono-bouquets", "Сливочная нега — нежный монобукет в светлых тонах.", "Тактильная мягкость и чистая форма."],
  ["Гранатовый блик", "roses", "Гранатовый блик — яркий букет с насыщенным характером.", "Смелый цвет и плотная фактура."],
  ["Аметистовый сад", "author", "Аметистовый сад — авторская композиция с глубокими оттенками.", "Богатая палитра и выразительный объём."],
  ["Солнечная ткань", "author", "Солнечная ткань — светлый букет с мягким сиянием.", "Тёплая палитра и аккуратная сборка."],
  ["Опаловый рассвет", "peonies", "Опаловый рассвет — нежная композиция с перламутровыми переходами.", "Воздушная форма и романтичное настроение."],
  ["Графитовая элегантность", "author", "Графитовая элегантность — сдержанный букет в духе modern luxury.", "Глубокие тона и premium-подача."],
  ["Медовая луна", "author", "Медовая луна — тёплый букет с мягким золотистым акцентом.", "Уютная палитра и тактильная роскошь."],
  ["Фарфоровый сад", "author", "Фарфоровый сад — изящная композиция с нежной фактурой.", "Светлые оттенки и аккуратная форма."],
  ["Коралловый рассвет", "roses", "Коралловый рассвет — жизнерадостный букет с тёплым акцентом.", "Яркая, но утончённая палитра."],
  ["Лавандовый туман", "author", "Лавандовый туман — спокойная композиция с мягким ароматом лета.", "Пастельные оттенки и воздушная подача."],
  ["Бронзовый закат", "author", "Бронзовый закат — букет с тёплым вечерним светом.", "Насыщенные оттенки и выразительный силуэт."],
  ["Снежная корона", "mono-bouquets", "Снежная корона — чистый монобукет с холодной элегантностью.", "Белоснежная палитра и безупречная форма."],
  ["Ирисовый шёлк", "author", "Ирисовый шёлк — глубокая композиция с благородным оттенком.", "Выразительный цвет и premium-упаковка."],
  ["Магнолиевая дымка", "author", "Магнолиевая дымка — нежный букет с ощущением весны.", "Мягкие линии и свежие цветы."],
  ["Терракотовый свет", "author", "Терракотовый свет — тёплая композиция с землистой палитрой.", "Натуральная эстетика и аккуратная сборка."],
  ["Жасминовый вечер", "author", "Жасминовый вечер — романтичный букет для особого момента.", "Нежная палитра и утончённая форма."],
  ["Океанский жемчуг", "hydrangeas", "Океанский жемчуг — объёмная композиция с прохладным сиянием.", "Пышный силуэт и спокойная роскошь."],
  ["Каштановый бархат", "roses", "Каштановый бархат — глубокий букет с благородной фактурой.", "Насыщенные тона и плотная сборка."],
  ["Первый снег", "mono-bouquets", "Первый снег — светлый букет с зимней чистотой оттенков.", "Нежная палитра и аккуратная форма."],
  ["Виноградный сумрак", "author", "Виноградный сумрак — насыщенная авторская композиция.", "Глубокие оттенки и выразительный объём."],
  ["Капучиновая нежность", "author", "Капучиновая нежность — мягкий букет с уютным характером.", "Тёплая палитра и тактильная роскошь."],
  ["Серебряный лёд", "author", "Серебряный лёд — холодная элегантность в premium-подаче.", "Чистые линии и безупречная упаковка."],
  ["Розовый флер", "roses", "Розовый флер — романтичный букет с лёгким настроением.", "Нежные оттенки и изящная форма."],
  ["Абрикосовый сад", "author", "Абрикосовый сад — солнечная композиция с тёплым светом.", "Мягкая палитра и натуральная фактура."],
  ["Ночная орхидея", "vip", "Ночная орхидея — загадочная VIP-композиция для особого случая.", "Глубокие тона и premium-сборка."],
  ["Мускатная дымка", "author", "Мускатная дымка — букет с тёплым пряным характером.", "Богатая палитра и аккуратная подача."],
  ["Лазурная волна", "hydrangeas", "Лазурная волна — свежая композиция с прохладным акцентом.", "Объёмная форма и спокойная эстетика."],
  ["Карамельная роза", "roses", "Карамельная роза — сладкий букет с тёплым оттенком.", "Романтичная палитра и premium-упаковка."],
  ["Туманное утро", "author", "Туманное утро — мягкая композиция с ощущением тишины.", "Пастельные оттенки и воздушная форма."],
  ["Имбирный закат", "author", "Имбирный закат — тёплый букет с золотистым акцентом.", "Насыщенная, но тактичная палитра."],
  ["Ледяная роза", "roses", "Ледяная роза — холодная элегантность в монохромной подаче.", "Чистая форма и стойкость."],
  ["Папоротниковый сад", "author", "Папоротниковый сад — зелёная свежесть в premium-композиции.", "Натуральная фактура и аккуратная сборка."],
  ["Крем-брюле", "mono-bouquets", "Крем-брюле — нежный монобукет с десертной мягкостью оттенков.", "Светлая палитра и тактильная роскошь."],
  ["Голубая лагуна", "hydrangeas", "Голубая лагуна — объёмный букет с прохладным сиянием.", "Воздушный силуэт и спокойная эстетика."],
  ["Рубиновая нить", "roses", "Рубиновая нить — страстный букет с глубоким характером.", "Насыщенный цвет и плотная фактура."],
  ["Шёлковый рассвет", "author", "Шёлковый рассвет — нежная композиция с утренним светом.", "Мягкие переходы и premium-подача."],
  ["Платиновый блеск", "vip", "Платиновый блеск — статусный букет для особого случая.", "Сдержанная роскошь Bellaflore."],
  ["Малиновый рассвет", "peonies", "Малиновый рассвет — яркий букет с летним настроением.", "Сочная палитра и воздушная форма."],
  ["Кедровый аромат", "author", "Кедровый аромат — букет с ощущением лесной свежести.", "Натуральная эстетика и аккуратная упаковка."],
  ["Жемчужный поцелуй", "roses", "Жемчужный поцелуй — романтичный букет с перламутровым сиянием.", "Нежная палитра и изящная форма."],
  ["Сахарная пудра", "mono-bouquets", "Сахарная пудра — светлый монобукет с нежным характером.", "Пастельные оттенки и чистая геометрия."],
  ["Тёмный бархат", "roses", "Тёмный бархат — глубокий букет для вечернего подарка.", "Насыщенные тона и выразительный силуэт."],
  ["Аквамарин", "hydrangeas", "Аквамарин — свежая композиция с морским настроением.", "Прохладная палитра и объёмная форма."],
  ["Карамельный закат", "author", "Карамельный закат — тёплый букет с мягким золотистым светом.", "Уютная палитра и premium-упаковка."],
  ["Лиловый бархат", "peonies", "Лиловый бархат — насыщенный букет с бархатной фактурой.", "Глубокие оттенки и выразительный объём."],
  ["Серебряный дождь", "author", "Серебряный дождь — элегантная композиция с холодным блеском.", "Чистые линии и свежие цветы."],
  ["Розовый шторм", "roses", "Розовый шторм — смелый букет с ярким характером.", "Выразительная палитра и плотная сборка."],
  ["Медовый сад", "author", "Медовый сад — тёплая композиция с солнечным настроением.", "Мягкие оттенки и натуральная фактура."],
  ["Белый туман", "mono-bouquets", "Белый туман — чистый монобукет с воздушной лёгкостью.", "Светлая палитра и безупречная форма."],
  ["Индиго ночь", "author", "Индиго ночь — глубокая композиция с вечерним характером.", "Контрастные оттенки и выразительный объём."],
  ["Персиковый блеск", "author", "Персиковый блеск — нежный букет с тёплым акцентом.", "Романтичная палитра и аккуратная сборка."],
];

const TEST_TITLES = new Set([
  "лунный купол",
  "белая бесконечность",
  "ягодный сад",
  "сад розовых облаков",
  "малиновый фарфор",
]);

function emptyForm() {
  return {
    id: null, title: "", slug: "", categoryId: "roses", shortDescription: "", fullDescription: "",
    composition: "", tags: "", status: "published", availability: "in_stock",
    sizePrices: { S: "", M: "", L: "", XL: "" }, oldPriceRub: "", flowerCount: "", heightCm: "",
    widthCm: "", colorPalette: "", occasion: "", isFeatured: false, isNew: true, isBestseller: false,
    isPromotion: false, images: [], mainImageUrl: "", mainImageAlt: "", mainImageTemporary: false,
    mainImageStorage: "none", galleryUrls: [], seoTitle: "", seoDescription: "", seoH1: "", seoSlug: "",
    seoKeywords: "", seoFaq: [], seoImageAlt: "", seoGalleryAlt: [], openGraphTitle: "",
    openGraphDescription: "", schemaProductJsonLd: {}, seoScore: 0, seoRecommendations: [],
    internalLinkSuggestions: [],
  };
}

function detectCategory(filePath, defaultCat) {
  const base = path.basename(filePath).toLowerCase();
  if (/pion|peoni/.test(base)) return "peonies";
  if (/rose|roza|rozy|kust/.test(base)) return "roses";
  if (/gort|hydr/.test(base)) return "hydrangeas";
  if (/mix|mati|matiol/.test(base)) return "author";
  if (/white/.test(base)) return "mono-bouquets";
  return defaultCat;
}

async function login() {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });
  const body = await res.json();
  if (!res.ok || !body.authenticated) {
    throw new Error(body.message || "Admin login failed");
  }
  const setCookie = res.headers.getSetCookie?.() || [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  if (!user || !pass) {
    console.error("ERROR: ADMIN_USERNAME/ADMIN_PASSWORD not found in .env.vercel.local");
    process.exit(2);
  }

  if (!fs.existsSync(MANIFEST)) {
    console.error("ERROR: photo manifest missing — run photo prep first");
    process.exit(2);
  }

  const remaining = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const cookie = await login();

  const listRes = await fetch(`${BASE}/api/admin/products`, { headers: { Cookie: cookie } });
  const listBody = await listRes.json();
  const existingSlugs = new Set((listBody.products || []).map((p) => p.slug));
  const existingTitles = new Set((listBody.products || []).map((p) => p.title?.toLowerCase()));

  const stats = {
    photosFound: 81,
    duplicatesSkipped: 16,
    uploadOk: 0,
    uploadTotal: 0,
    created: 0,
    createdTotal: 0,
    published: 0,
    publishedTotal: 0,
    failed: 0,
    errors: [],
    createdItems: [],
  };

  let nameIdx = 0;
  let createdCount = 0;

  for (const photo of remaining) {
    if (createdCount >= 75) break;

    const [title, defaultCat, shortDesc, fullDesc] = NAMES[nameIdx % NAMES.length];
    nameIdx++;
    if (TEST_TITLES.has(title.toLowerCase()) || existingTitles.has(title.toLowerCase())) continue;

    let slug = slugify(title);
    let suffix = 2;
    while (existingSlugs.has(slug)) slug = `${slugify(title)}-${suffix++}`;

    stats.uploadTotal++;
    let imageUrl;
    let storage;
    try {
      const buf = fs.readFileSync(photo.path);
      const ext = path.extname(photo.path).toLowerCase().replace(".", "") || "jpg";
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const fd = new FormData();
      fd.append("image", new Blob([buf], { type: mime }), path.basename(photo.path));
      const up = await fetch(`${BASE}/api/admin/products/upload-image`, {
        method: "POST",
        headers: { Cookie: cookie },
        body: fd,
      });
      const upBody = await up.json();
      if (!up.ok) throw new Error(upBody.message || "upload failed");
      imageUrl = upBody.imageUrl;
      storage = upBody.storage;
      stats.uploadOk++;
    } catch (e) {
      stats.failed++;
      stats.errors.push(`${path.basename(photo.path)} upload: ${e.message}`);
      continue;
    }

    const price = priceAt(createdCount);
    const form = emptyForm();
    form.title = title;
    form.slug = slug;
    form.categoryId = detectCategory(photo.path, defaultCat);
    form.shortDescription = shortDesc;
    form.fullDescription = fullDesc;
    form.status = "published";
    form.sizePrices.M = String(price);
    form.mainImageUrl = imageUrl;
    form.mainImageAlt = `Букет ${title} — Bellaflore`;
    form.mainImageStorage = storage === "blob" ? "blob" : "server";
    form.seoTitle = `${title} — купить с доставкой | Bellaflore`;
    form.seoDescription = `${shortDesc} Доставка по Москве сегодня. Премиальные букеты Bellaflore.`;
    form.seoH1 = title;
    form.seoSlug = slug;
    form.seoImageAlt = `Букет ${title} — Bellaflore`;
    form.tags = `${title}, bellaflore, букет, доставка цветов`;

    stats.createdTotal++;
    try {
      const cr = await fetch(`${BASE}/api/admin/products`, {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const crBody = await cr.json();
      if (!cr.ok) throw new Error(crBody.message || "create failed");
      const product = crBody.product;
      stats.created++;
      existingSlugs.add(slug);
      existingTitles.add(title.toLowerCase());

      stats.publishedTotal++;
      const pub = await fetch(`${BASE}/api/admin/products/${encodeURIComponent(product.id)}/publish`, {
        method: "POST",
        headers: { Cookie: cookie },
      });
      const pubBody = await pub.json();
      if (!pub.ok || !pubBody.product?.isPublished) throw new Error(pubBody.message || "publish failed");
      stats.published++;
      stats.createdItems.push({ title, price, id: product.id, slug: product.slug });
      createdCount++;
      process.stderr.write(`OK ${createdCount} ${title} ${price} ${product.slug}\n`);
    } catch (e) {
      stats.failed++;
      stats.errors.push(`${title} (${path.basename(photo.path)}): ${e.message}`);
    }
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
