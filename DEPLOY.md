# Развёртывание ТЭКПРО на Ubuntu

Целевая схема:

```text
Интернет → Caddy 2.11.4 → Vinext/Node.js 22
             │
             └→ public/ (изображения, видео, шрифты и документы)
```

- Сервер: `217.112.43.150`
- Системный пользователь: `tekprooo3`
- Каталог приложения: `/opt/tekpro-site`
- Публичный адрес: `https://tekpro.ru`
- `https://www.tekpro.ru` перенаправляется на основной домен

Caddy получает у Let's Encrypt публично доверенные сертификаты для
`tekpro.ru` и `www.tekpro.ru` и автоматически продлевает их. Том
`caddy_data` нельзя удалять.

## 1. Отправка конфигурации в GitHub

Эти команды выполняются на локальном компьютере после проверки изменений:

```bash
git status
git add .dockerignore Caddyfile Dockerfile compose.yaml DEPLOY.md next.config.ts
git commit -m "Add Docker and Caddy deployment"
git push origin main
```

## 2. Подготовка пользователя

Если пользователь `tekprooo3` уже существует и имеет `sudo`, этот раздел
можно пропустить.

Сначала подключиться под `root`:

```bash
ssh root@217.112.43.150
```

Создать пользователя и добавить его в группу `sudo`:

```bash
id tekprooo3 >/dev/null 2>&1 || adduser tekprooo3
usermod -aG sudo tekprooo3
```

Если вход под `root` выполнялся по SSH-ключу, скопировать ключ пользователю:

```bash
if [ -s /root/.ssh/authorized_keys ]; then
  install -d -m 700 -o tekprooo3 -g tekprooo3 /home/tekprooo3/.ssh
  install -m 600 -o tekprooo3 -g tekprooo3 \
    /root/.ssh/authorized_keys \
    /home/tekprooo3/.ssh/authorized_keys
fi
```

Переподключиться:

```bash
exit
ssh tekprooo3@217.112.43.150
```

Проверить `sudo`:

```bash
sudo -v
```

## 3. Обновление Ubuntu и firewall

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y ca-certificates curl git ufw
```

Открыть SSH, HTTP, HTTPS и HTTP/3:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
sudo ufw status verbose
```

Если SSH работает не на стандартном порту, до включения UFW нужно разрешить
фактический SSH-порт вместо профиля `OpenSSH`.

## 4. Установка Docker Engine и Docker Compose

Удалить конфликтующие неофициальные пакеты, если они установлены:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt remove -y "$pkg"
done
```

Подключить официальный репозиторий Docker:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

sudo systemctl enable --now docker
```

Проверить установку:

```bash
sudo docker version
sudo docker compose version
sudo docker run --rm hello-world
```

Команды ниже намеренно используют `sudo docker`. Добавление пользователя в
группу `docker` фактически предоставляет ему root-доступ к серверу.

## 5. Клонирование репозитория

```bash
sudo install -d -m 0755 -o tekprooo3 -g tekprooo3 /opt/tekpro-site

git clone \
  --branch main \
  --single-branch \
  https://github.com/Tranqu1111ty/tek_pro_site.git \
  /opt/tekpro-site

cd /opt/tekpro-site
git status
git log -1 --oneline
```

## 6. Проверка и первый запуск

Проверить итоговую Compose-конфигурацию:

```bash
cd /opt/tekpro-site
sudo docker compose config
```

Загрузить точный образ Caddy и проверить `Caddyfile`:

```bash
sudo docker compose pull caddy

sudo docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2.11.4-alpine \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

Собрать приложение:

```bash
sudo docker compose build --pull app
```

Запустить сервисы:

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=100 app caddy
```

Caddy должен получить сертификаты Let's Encrypt для `tekpro.ru` и
`www.tekpro.ru`. Для первичного выпуска порт `80/tcp` должен быть доступен из
интернета, а A-записи обоих имён должны указывать на `217.112.43.150`. Обычно
сертификаты появляются в течение нескольких секунд.

## 7. Проверка сайта

```bash
curl -I http://tekpro.ru
curl -I https://tekpro.ru
curl -I https://www.tekpro.ru
curl -I https://tekpro.ru/media/logo6.png
curl -fsS https://tekpro.ru/ >/dev/null \
  && echo "Сайт работает"
```

Открыть в браузере:

```text
https://tekpro.ru
```

Проверить версию Caddy:

```bash
sudo docker compose exec caddy caddy version
```

Ожидаемая версия начинается с `v2.11.4`.

## 8. Повседневные команды

Статус:

```bash
cd /opt/tekpro-site
sudo docker compose ps
```

Логи:

```bash
sudo docker compose logs -f --tail=200 app caddy
```

Перезапуск:

```bash
sudo docker compose restart
```

Остановка:

```bash
sudo docker compose down
```

Повторный запуск:

```bash
sudo docker compose up -d
```

Команду `docker compose down -v` использовать нельзя: ключ `-v` удалит том с
данными Caddy, ACME-аккаунтом и сертификатами.

## 9. Обновление сайта

```bash
cd /opt/tekpro-site
git pull --ff-only

sudo docker compose build --pull app
sudo docker compose pull caddy
sudo docker compose up -d --remove-orphans
sudo docker compose up -d --no-deps --force-recreate caddy

sudo docker compose ps
sudo docker compose logs --tail=100 app caddy
curl -fsS https://tekpro.ru/ >/dev/null \
  && echo "Обновление успешно"
```

## 10. Изменение Caddyfile

После изменения и доставки `Caddyfile` на сервер проверить файл отдельным
одноразовым контейнером:

```bash
cd /opt/tekpro-site

sudo docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2.11.4-alpine \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

sudo docker compose up -d --no-deps --force-recreate caddy
```

`Caddyfile` смонтирован в контейнер как отдельный файл. Git может заменить его
новым inode при `git pull`, поэтому обычный `caddy reload` внутри старого
контейнера способен перечитать прежнюю версию файла. Пересоздание только
контейнера `caddy` заново подключает актуальный файл и не удаляет тома,
ACME-аккаунт или сертификаты.

## 11. Диагностика

Если контейнер приложения не стал `healthy`:

```bash
sudo docker compose ps
sudo docker compose logs --tail=300 app
sudo docker inspect "$(sudo docker compose ps -q app)" \
  --format '{{json .State.Health}}'
```

Если не выпускается сертификат:

```bash
sudo ss -lntup | grep -E ':(80|443)\b'
sudo ufw status verbose
sudo docker compose logs --tail=300 caddy
curl -I http://tekpro.ru
```

Проверить, что порты `80/tcp`, `443/tcp` и `443/udp` также разрешены во
внешнем firewall панели хостинг-провайдера, если он используется.

## 12. DNS

Для домена должны быть настроены записи:

```text
tekpro.ru      A  217.112.43.150
www.tekpro.ru  A  217.112.43.150
```

AAAA-записи не следует добавлять, пока сервер не настроен и не проверен по
IPv6. Caddy автоматически выпустит и будет продлевать стандартные сертификаты
для обоих доменных имён.
