# ТЭКПРО — корпоративный сайт

Корпоративный сайт инженерно-проектной компании ТЭКПРО. Проект включает
кинематографичный первый экран, сведения о компании, этапы проектирования,
компетенции, нормативную базу, лабораторию, IT/ИИ-направления и контакты.

## Технологии

- React 19 и TypeScript
- Next.js-совместимая структура приложения
- Vinext и Vite
- Tailwind CSS 4
- Motion и Lenis

## Требования

- Node.js `>=22.13.0`
- npm

## Локальный запуск

```bash
npm install
npm run dev
```

После запуска сайт доступен по адресу `http://127.0.0.1:3001`.

## Проверка production-сборки

```bash
npm run build
npm test
```

## Деплой через Docker и Caddy

Для production-развёртывания используются:

- `app` — standalone-сборка Vinext/Node.js на внутреннем порту `3000`;
- `caddy` — Caddy `2.11.4`, принимающий HTTP, HTTPS и HTTP/3;
- `public/` — изображения, видео, шрифты и документы, которые Caddy отдаёт
  напрямую;
- `caddy_data` — постоянный Docker volume с ACME-аккаунтом и сертификатами.

Docker Engine и плагин Docker Compose должны быть установлены заранее.

Перед первым запуском проверить конфигурацию:

```bash
docker compose config
docker compose pull caddy

docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2.11.4-alpine \
  validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

Собрать и запустить сайт:

```bash
docker compose build --pull app
docker compose up -d
```

Проверить состояние и логи:

```bash
docker compose ps
docker compose logs --tail=200 app caddy
```

Текущая конфигурация публикует сайт по адресу
[`https://217.112.43.150`](https://217.112.43.150). Caddy автоматически
получает и продлевает сертификат Let's Encrypt для IP-адреса.

Проверка доступности:

```bash
curl -I https://217.112.43.150
curl -I https://217.112.43.150/media/logo6.png
```

### Обновление

```bash
git pull --ff-only
docker compose build --pull app
docker compose pull caddy
docker compose up -d --remove-orphans
```

Если изменился `Caddyfile`, нужно пересоздать только контейнер Caddy, чтобы
bind mount подключил актуальную версию файла:

```bash
docker compose up -d --no-deps --force-recreate caddy
```

Остановка сервисов:

```bash
docker compose down
```

Не используйте `docker compose down -v`: ключ `-v` удалит volume
`caddy_data` вместе с ACME-аккаунтом и сертификатами.

## Структура

- `app/` — страница, layout и глобальные стили
- `components/` — секции и UI-компоненты
- `data/` — фактическое текстовое содержание сайта
- `public/media/` — изображения и видео
- `public/documents/` — публичные документы
- `tests/` — проверки серверного рендера и обязательных ресурсов
- `Dockerfile` — production-образ standalone-приложения
- `compose.yaml` — контейнеры приложения и Caddy
- `Caddyfile` — HTTPS, reverse proxy и раздача публичных файлов

Фактические сведения на сайте основаны на исходном материале
[`text for site.txt`](./text%20for%20site.txt).
