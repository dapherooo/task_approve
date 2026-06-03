# Docker Setup untuk Task Approve

Panduan lengkap untuk build dan push Docker image.

## File yang dibuat:
- **Dockerfile** - Multi-stage build untuk optimasi image size
- **.dockerignore** - File/folder yang diabaikan saat build
- **.github/workflows/docker-build-push.yml** - Workflow untuk push ke Docker Hub
- **.github/workflows/ghcr-build-push.yml** - Workflow untuk push ke GitHub Container Registry

## Setup untuk Docker Hub

### 1. Buat Docker Hub Account
- Daftar di https://hub.docker.com/

### 2. Buat Personal Access Token
- Login ke Docker Hub
- Ke Settings → Security
- Buat "New Access Token"

### 3. Setup GitHub Secrets
Tambahkan di GitHub repository:
- Ke Settings → Secrets and variables → Actions
- Tambahkan secrets:
  - `DOCKER_USERNAME` - Username Docker Hub Anda
  - `DOCKER_PASSWORD` - Personal Access Token dari Docker Hub

### 4. Push dan deploy
```bash
git add .
git commit -m "Add Docker setup"
git push origin main
```

Image akan otomatis di-build dan di-push ke:
```
docker.io/<username>/<repository-name>:latest
docker.io/<username>/<repository-name>:main
```

## Setup untuk GitHub Container Registry (GHCR)

GHCR menggunakan `GITHUB_TOKEN` secara otomatis, jadi tidak perlu setup secrets tambahan!

Image akan otomatis di-push ke:
```
ghcr.io/<username>/<repository-name>:latest
ghcr.io/<username>/<repository-name>:main
```

## Menjalankan Container Locally

### Dari Docker Hub:
```bash
docker run -p 3000:3000 --env-file .env <username>/task_approve:latest
```

### Dari GHCR:
```bash
docker run -p 3000:3000 --env-file .env ghcr.io/<username>/task_approve:latest
```

## Build Docker Image Locally

```bash
docker build -t task_approve:latest .
docker run -p 3000:3000 --env-file .env task_approve:latest
```

## Environment Variables

Pastikan `.env` file sudah ada dengan variables:
- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Bot token dari Telegram
- `NOTION_API_KEY` - API key dari Notion
- Dan variable lain sesuai kebutuhan

Lihat `.env.example` sebagai referensi.

## Tagging & Release

Untuk membuat release dengan tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

Image akan di-tag sebagai:
- `v1.0.0`
- `1.0`
- `latest` (hanya untuk branch main/master)

## Troubleshooting

### Build gagal karena `tsc not found`
Pastikan `typescript` ada di `package.json` devDependencies

### Container tidak bisa connect ke database
Pastikan `DATABASE_URL` di `.env` benar dan database bisa di-reach dari container

### Port 3000 sudah terpakai
Gunakan port lain:
```bash
docker run -p 8080:3000 task_approve:latest
```
