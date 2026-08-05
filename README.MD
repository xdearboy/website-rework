# xdearboy // личный сайт

мой личный сайт: лендинг про меня, блог, фотогалерея, гостевая книга, donate
и архив переписок (degens). тёмный минимализм, catppuccin mocha, моноширинный шрифт.
gsap-анимации и интерактивный webgl-фон. на русском и английском (язык подхватывается из браузера).

---

## что внутри

- **главная** — длинный лендинг: обо мне, что дальше, разделы, проекты (карусель с github),
  активность и стек. в футере — last.fm «сейчас играет», локальное время и погода (тверь), цитата
  и хеш коммита.
- **блог** (`/blog`) — markdown-посты из `content/blog/`, ru/en (рядом лежит `<slug>.en.md`),
  тёмный код-хайлайт, теги, поиск и rss (`/rss.xml`). на постах — просмотры и реакции.
- **галерея** (`/gallery`) — фотки с exif, превью, лайтбокс с зумом (shift + колёсико),
  стрелки/esc. фото живут в облаке, не в репозитории (см. ниже).
- **гостевая книга** (`/guestbook`) — вход через github, ответы в один уровень (ответ на ответ
  приклеивается к той же ветке), удаление — только у владельца. лимит на запись — 30 секунд,
  он удваивается за каждые 5 сообщений за 10 минут (потолок 15 минут).
- **changelog** (`/changelog`) — собирается на билде из `feat:`-коммитов, руками не ведётся.
- **uses** (`/uses`) — железо и софт, которыми пользуюсь.
- **degens** (`/degens`) — анонимизированный архив телеграм-переписок (контент не переводится).
- **активность** — сетка контрибуций github + статистика времени за кодингом из wakatime.
- **donate** (`/donate`), **404** и прочее по мелочи.

## стек

**фронт:** vite 5 + react 18 + typescript, react router v6, tailwind v4 (токены в oklch),
shadcn/ui, gsap (+ scrollsmoother, splittext, scrambletext), three/postprocessing (фон pixelblast),
i18next (ru/en, автоопределение по браузеру).

**бэк:** elysia (адаптер `@elysiajs/node` — в проде крутится на чистом node), роуты разложены
по `src/server/routes/`: wakatime, web-vitals, github-oauth, гостевая книга, статистика постов.
галерее бэкенд не нужен.

**бд:** postgres — гостевая книга, сессии, просмотры и реакции. схема создаётся сама при
старте (`ensureSchema`), миграционного фреймворка нет. локально поднимается через
`docker compose up -d`.

**хранилище фоток:** s3-совместимое object storage (по умолчанию **yandex object storage**).
скрипт заливки жмёт webp-превью, читает exif и пишет `gallery-manifest.json`; фронт читает манифест
и картинки напрямую по публичным url. фото не в git и не в docker-образе.

**инфра:** docker (multi-stage, bun) + nginx, деплой в k3s, haproxy ingress, cert-manager (tls),
hpa (2–10 подов). ci/cd — github actions (self-hosted runner) → ghcr.io.

---

## локально

```bash
bun install
docker compose up -d   # postgres на :5433
bun run dev            # фронт :5173 (+ api проксируется на /api), бэк :3000
bun run build          # прод-сборка → dist/
bun run test           # vitest
```

переменные — из `.env.example`. без `DATABASE_URL` фронт и блог работают, а гостевая книга
и статистика постов отвечают 500.

вход через github локально требует **отдельного** oauth app: у приложения только один
callback url, а прод занят `https://d3vo.ru/api/auth/github/callback`.

проверить, что галерея грузится локально — добавь в `.env` строку
`VITE_GALLERY_BASE_URL=https://storage.yandexcloud.net/<бакет>`.

отладочный флаг анимаций: `?motion=force` включает gsap даже при системном
«уменьшить движение» (`?motion=auto` — обратно).

## фотки в галерею

всё про настройку хранилища и заливку — в [`scripts/README.md`](scripts/README.md).
если коротко: кидаешь фото в `gallery-src/<Категория>/`, запускаешь
`node --env-file=.env scripts/upload-gallery.ts` (прогресс-бар, пропускает уже залитое,
переживает обрывы), и всё уезжает в облако + обновляется манифест.

## деплой

пуш в `main` → github actions: параллельно гоняются тесты и собирается docker-образ, потом
образ уезжает в ghcr.io и катится в k3s. в контейнере nginx (фронт) + elysia (api).
упавшие тесты деплой не пропускают.

тесты в ci запускаются под **настоящим node**, а не под bun: node — это прод-рантайм сервера,
и elysia на нём ведёт себя иначе (плюс vitest 1.x ломается о bun-овский worker_threads).

манифесты (включая `k8s/postgres.yaml`) применяет сам workflow, руками `kubectl` звать не нужно.

нужные секреты в settings → secrets and variables → actions:

| секрет / переменная | зачем |
| --- | --- |
| `VITE_GALLERY_BASE_URL` (variable) | откуда фронт грузит галерею, прокидывается в `docker build` |
| `POSTGRES_PASSWORD` | из него workflow собирает секрет `postgres-credentials` |
| `GH_OAUTH_CLIENT_ID` / `GH_OAUTH_CLIENT_SECRET` | github oauth (префикс `GITHUB_` в actions запрещён) |

> postgres просит longhorn-том, поэтому в `k8s/postgres.yaml` стоит nodeAffinity: без него под
> может уехать на ноду без longhorn и навсегда зависнуть в `ContainerCreating`.
