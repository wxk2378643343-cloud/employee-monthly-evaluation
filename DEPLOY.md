# Docker Deployment Guide

## 1. Recommended server path
Use `/opt/eval-system` as the project root on Linux server:

```bash
sudo mkdir -p /opt/eval-system
sudo chown -R $USER:$USER /opt/eval-system
```

Put these files under `/opt/eval-system`:
- `docker-compose.yml`
- `.env` (copy from `.env.example`)
- `backend/`
- `frontend/`

## 2. Prepare environment variables

```bash
cd /opt/eval-system
cp .env.example .env
vim .env
```

Make sure these values are updated:
- `DB_ROOT_PASSWORD`
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`

## 3. Start services

```bash
docker compose up -d --build
```

## 4. Check status

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## 5. Access
- Frontend: `http://<server-ip>/`
- Backend health (if endpoint exists): `http://<server-ip>/api/...`

## 6. Upgrade workflow

```bash
cd /opt/eval-system
git pull
docker compose up -d --build
```

## 7. Backup suggestion
Backup these directories regularly:
- `./data/mysql`
- `./data/redis`

## 8. Production hardening suggestions
- Put a host-level Nginx/Caddy in front and enable HTTPS.
- Restrict DB/Redis ports in firewall (or remove exposed ports in compose if only internal use).
- Rotate JWT secret and DB/Redis passwords.
