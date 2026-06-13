# Галерея: хранение в S3-совместимом Object Storage

Фото галереи не лежат в репозитории и не попадают в Docker-образ. Они хранятся в
S3-совместимом бакете (по умолчанию — Yandex Object Storage). `upload-gallery.ts` жмёт
webp-превью, читает EXIF, загружает оригинал + превью и пишет `gallery-manifest.json`
в корень бакета. Фронтенд читает манифест и картинки напрямую по публичным URL — отдельного
бэкенда галереи нет.

Работает с любым S3-совместимым хранилищем (Yandex, MinIO, R2) — меняются только
`S3_ENDPOINT`/`S3_REGION` и ключи.

## Разовая настройка (Yandex Object Storage)

1. Создай бакет в Object Storage. Включи публичный доступ на **чтение объектов**.
2. Создай сервисный аккаунт и выдай ему роль `storage.editor` на бакет.
3. Создай для него **статический ключ доступа** (Access Key ID + Secret access key).
4. Скопируй `.env.example` в `.env` и заполни:

   ```
   VITE_GALLERY_BASE_URL=https://storage.yandexcloud.net/<бакет>
   S3_ENDPOINT=https://storage.yandexcloud.net
   S3_REGION=ru-central1
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_BUCKET=<бакет>
   GALLERY_BASE_URL=https://storage.yandexcloud.net/<бакет>
   GALLERY_SRC=./gallery-src
   ```

5. Настрой CORS на бакете (чтобы фронт мог запросить `gallery-manifest.json` из браузера):

   ```
   node --env-file=.env scripts/setup-bucket-cors.ts
   ```

   (или вручную в консоли — разрешить метод GET с домена сайта).

## Добавить фото

1. Положи изображения в `GALLERY_SRC` по подпапкам-категориям (подпапка верхнего уровня =
   категория в галерее), при желании с вложенностью:

   ```
   gallery-src/
     Поездки/
       photo1.jpg
       Кронштадт/
         photo2.jpg
     Стрит/
       photo3.jpg
   ```

   Поддерживаются `.jpg`, `.jpeg`, `.png`.

2. Запусти заливку:

   ```
   node --env-file=.env scripts/upload-gallery.ts
   ```

   Скрипт показывает прогресс-бар, **пропускает уже залитые** файлы и переживает обрывы —
   можно перезапускать, продолжит с места. Оригинал кладётся в `photos/<путь>`, превью в
   `thumbs/<путь>.webp`, в конце обновляется `gallery-manifest.json`
   (`Cache-Control: max-age=300`, изменения подхватываются быстро).

## Деплой

Для прод-сборки задай в GitHub Actions переменную репозитория `VITE_GALLERY_BASE_URL`
(Settings → Secrets and variables → Actions → Variables) — она прокидывается в сборку
фронтенда как build-arg (см. `Dockerfile` и `.github/workflows/deploy.yml`).
