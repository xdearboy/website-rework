# xdearboy // личный сайт

мой личный сайт: лендинг про меня, блог, фотогалерея, donate и архив переписок (degens).
тёмный минимализм, catppuccin mocha, моноширинный шрифт.
gsap-анимации и интерактивный webgl-фон. на русском и английском (язык подхватывается из браузера).

---

## что внутри

- **главная** — длинный лендинг: обо мне, что дальше, разделы, проекты (карусель с github),
  активность и стек. в футере — last.fm «сейчас играет», локальное время и погода (тверь), цитата
  и хеш коммита.
- **блог** (`/blog`) — markdown-посты из `content/blog/`, ru/en (рядом лежит `<slug>.en.md`),
  тёмный код-хайлайт.
- **галерея** (`/gallery`) — фотки с exif, превью, лайтбокс с зумом (shift + колёсико),
  стрелки/esc. фото живут в облаке, не в репозитории (см. ниже).
- **degens** (`/degens`) — анонимизированный архив телеграм-переписок (контент не переводится).
- **активность** — сетка контрибуций github + статистика времени за кодингом из wakatime.
- **donate** (`/donate`), **404** и прочее по мелочи.

## стек

**фронт:** vite 5 + react 18 + typescript, react router v6, tailwind v4 (токены в oklch),
shadcn/ui, gsap (+ scrollsmoother, splittext, scrambletext), three/postprocessing (фон pixelblast),
i18next (ru/en, автоопределение по браузеру).

**бэк:** elysia на bun - лёгкий api (прокси статистики wakatime). галерее бэкенд не нужен.

**хранилище фоток:** s3-совместимое object storage (по умолчанию **yandex object storage**).
скрипт заливки жмёт webp-превью, читает exif и пишет `gallery-manifest.json`; фронт читает манифест
и картинки напрямую по публичным url. фото не в git и не в docker-образе.

**инфра:** docker (multi-stage, bun) + nginx, деплой в k3s, haproxy ingress, cert-manager (tls),
hpa (2–10 подов). ci/cd — github actions (self-hosted runner) → ghcr.io.

---

## локально

```bash
pnpm install
pnpm dev      # фронт :5173 (+ api проксируется на /api), бэк :3000
pnpm build    # прод-сборка → dist/
```

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

пуш в `main` → github actions собирает docker-образ → пушит в ghcr.io → катит в k3s.
в контейнере nginx (фронт) + elysia (api).

фронту на сборке нужен `VITE_GALLERY_BASE_URL`, чтобы знать, откуда грузить галерею — задаётся
переменной репозитория (settings → secrets and variables → actions → variables), workflow
прокидывает её в `docker build` как build-arg.

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```
