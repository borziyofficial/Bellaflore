# Bella Flore production baseline

Дата фиксации: 2026-08-01.

## Неизменяемый источник

- GitHub: `borziyofficial/Bellaflore`
- Commit: `baf899b50724e5bfae1a9142c51236d94040ffc4`
- Tree: `81d06128f7ca07510e67880aa26087af8111e84e`
- Tag: `sandbox-release-baf899b-2026-08-01`
- Рабочая ветка: `codex/production-readiness`
- Vercel project: `bellaflore-sandbox`
- Vercel project ID: `prj_mNpvM4qk8XTfkqnz2FRlibf5mnBf`
- Production deployment: `dpl_94c1pqLC1gdGUdEPA6dsEt5QfFzV`
- Preview deployment: `dpl_3ZUjEK9KgVQACnjJVsJcd5ELFHJu`

## Baseline checklist

- Главная страница отвечает HTTP 200, показывает hero и преимущества BellaFlore без критической ошибки Next.js.
- `/catalog` переводит пользователя к каталогу; поиск, очистка и выбор категории работают.
- Карточка опубликованного товара показывает доступные размеры и цены и открывает подробную карточку.
- `/admin/login` доступен; неверные данные не создают сессию; закрытый admin API без сессии отвечает 401.
- `/api/catalog/products?published=1` и `/api/catalog/categories` отвечают 200 и возвращают непустые JSON-массивы.
- Sandbox публикует canonical `https://sandbox.bellaflore.ru`, Open Graph URL и `noindex, nofollow`.
- На viewport 390×844 нет горизонтального overflow; верхнее меню и нижняя мобильная навигация доступны.

## Запуск smoke-тестов

По умолчанию тесты выполняются против публичного Sandbox и не требуют credentials:

```bash
npm run test:smoke
```

Явная конфигурация окружения:

```bash
SMOKE_BASE_URL=https://sandbox.bellaflore.ru \
SMOKE_EXPECTED_CANONICAL=https://sandbox.bellaflore.ru \
SMOKE_EXPECT_NOINDEX=true \
npm run test:smoke
```

Переменные содержат только публичные ожидания. Пароли, токены и API-ключи тестам не требуются.

## Известные дефекты baseline

- На iPhone viewport Sandbox badge пересекается с верхней областью header.
- Checkout не готов к Production: Yandex GeoSuggest/Maps и Telegram ENV не настроены.
- Заказ не сохраняется на сервере как независимая транзакция до уведомления Telegram.
- В order utilities остаётся fallback на локальный backend `127.0.0.1:8000`.
- В каталоге и контактах присутствуют тестовые данные, фиктивные контакты и английские названия.
- Canonical и `noindex` корректны для Sandbox, но не подходят для официального домена.
- Next.js 16.2.7 и связанные зависимости требуют отдельного контролируемого обновления после фиксации baseline.

Эти дефекты документируются, но не исправляются в Task 1A.
