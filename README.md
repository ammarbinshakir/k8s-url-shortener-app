# URL Shortener 🔗

A blazing-fast, production-ready URL shortening service using Node.js, Redis, and PostgreSQL — deployable via Docker Compose or Kubernetes.

![Docker](https://img.shields.io/badge/docker-ready-blue)
![Kubernetes](https://img.shields.io/badge/k8s-compatible-brightgreen)
![PostgreSQL](https://img.shields.io/badge/db-PostgreSQL-blue)
![Redis](https://img.shields.io/badge/cache-Redis-red)
![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)

---

## 📚 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
  - [Docker Compose (Recommended)](#option-1-docker-compose-recommended-for-development)
  - [Kubernetes (Production)](#option-2-kubernetes-production)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Docker](#-docker)
- [Kubernetes Deployment](#️-kubernetes-deployment)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Monitoring](#-monitoring)
- [Security Considerations](#-security-considerations)
- [Performance](#-performance)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🚀 Features

- **Fast URL Shortening**: Generate short 7-character IDs using nanoid
- **In-Memory Redis Caching**: O(1) access to cached URLs for lightning-fast redirects
- **Persistent Storage**: PostgreSQL for reliable data persistence
- **Health Monitoring**: `/health`, `/health/liveness`, `/health/readiness` endpoints
- **Kubernetes Ready**: Liveness and readiness probes included
- **Containerized**: Docker-ready for local or cloud deployment
- **Kubernetes Native**: Full K8s manifests for scaling and production ops
- **RESTful API**: Clean and intuitive API design

---

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Kubernetes cluster
- `kubectl` configured

---

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   Backend   │───▶│ PostgreSQL  │
└─────────────┘    │  (Node.js)  │    │  Database   │
                   │             │    └─────────────┘
                   │             │           │
                   │             │    ┌─────────────┐
                   │             │───▶│    Redis    │
                   └─────────────┘    │   Cache     │
                                      └─────────────┘
```

**Stack**: Node.js, Express, PostgreSQL 15, Redis 7, Docker, Kubernetes

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended for Development)

```bash
cd url-shortener
docker-compose up -d
docker-compose exec postgres psql -U postgres -d urlshortener -c "CREATE TABLE IF NOT EXISTS urls (id SERIAL PRIMARY KEY, short_id VARCHAR(10) UNIQUE NOT NULL, original_url TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
```

Test:

```bash
curl -X POST http://localhost:3000/shorten \
  -H 'Content-Type: application/json' \
  -d '{"original_url": "https://example.com"}'
```

---

### Option 2: Kubernetes (Production)

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend/
kubectl get pods

# Initialize database table
kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}') \
  -- psql -U postgres -d shortener \
  -c "CREATE TABLE IF NOT EXISTS urls (id SERIAL PRIMARY KEY, short_id VARCHAR(10) UNIQUE NOT NULL, original_url TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

kubectl port-forward svc/backend 3000:3000
```

---

## 📖 API Documentation

### 🔗 Shorten a URL

**POST** `/shorten`

```json
{
  "original_url": "https://example.com/very/long/url"
}
```

**Response:**

```json
{
  "short_id": "IpIZ1Co"
}
```

### 🔁 Redirect

**GET** `/:short_id`  
Returns HTTP 302 to original URL.

---

## 🧪 Health Check Endpoints

| Endpoint            | Description                    |
| ------------------- | ------------------------------ |
| `/health`           | Full health (DB, Redis)        |
| `/health/liveness`  | Liveness probe for Kubernetes  |
| `/health/readiness` | Readiness probe for Kubernetes |

Example:

```bash
curl http://localhost:3000/health
```

---

## 🛠️ Development

```bash
cd backend
npm install

export DATABASE_URL="postgres://postgres:postgres@localhost:5432/urlshortener"
export REDIS_HOST="localhost"
export PORT=3000

# Start services
docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=urlshortener postgres:15
docker run -d --name redis -p 6379:6379 redis:7

# Create table
docker exec -it postgres psql -U postgres -d urlshortener -c "CREATE TABLE IF NOT EXISTS urls (id SERIAL PRIMARY KEY, short_id VARCHAR(10) UNIQUE NOT NULL, original_url TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"

# Start app
npm start
```

---

## 🐳 Docker

```bash
cd backend
docker build -t url-shortener-backend .
docker tag url-shortener-backend your-registry/url-shortener-backend:latest
docker push your-registry/url-shortener-backend:latest
```

---

## ☸️ Kubernetes Deployment

**Structure:**

```
k8s/
├── postgres.yaml
├── redis.yaml
└── backend/
    ├── deployment.yaml
    ├── service.yaml
    ├── configmap.yaml
    └── secret.yaml
```

**Notes:**

- `DATABASE_URL` must be base64-encoded in `secret.yaml`
- Use `ConfigMap` for `REDIS_HOST` and `PORT`

Scale:

```bash
kubectl scale deployment url-shortener-backend --replicas=3
```

---

## 🔧 Configuration

| Variable       | Description                  | Default     | Required |
| -------------- | ---------------------------- | ----------- | -------- |
| `PORT`         | App port                     | `3000`      | No       |
| `DATABASE_URL` | PostgreSQL connection string | –           | ✅       |
| `REDIS_HOST`   | Redis host                   | `localhost` | ✅       |

---

## 🚨 Troubleshooting

### Common Errors

- **Password Auth Failed**: Check your `DATABASE_URL`
- **Table Doesn’t Exist**: Run the table creation SQL
- **Redis ECONNREFUSED**: Ensure Redis is running & accessible

### Debug Commands

```bash
kubectl logs -l app=backend
kubectl exec -it <backend-pod> -- wget -qO- http://redis:6379
kubectl exec -it <postgres-pod> -- psql -U postgres -d shortener -c "\dt"
```

---

## 📊 Monitoring

- `/health`: Full status
- `/health/liveness`: Liveness probe
- `/health/readiness`: Readiness probe

🧪 Future:

- `/metrics` Prometheus-compatible endpoint
- Grafana dashboard template

---

## 🔐 Security Considerations

- DB credentials stored in Kubernetes Secrets
- No rate limiting or auth — **not safe for public production use**
- Input validation should be stricter
- Consider WAF/API Gateway for public deployments

⚠️ **Warning**: This app does not include security hardening or abuse protection out of the box.

---

## 🚀 Performance

- **Cache-First Lookup**: Redis used for instant redirect
- **DB Fallback**: Only hits PostgreSQL if not cached
- **Auto-population**: Caches DB lookup results for future hits

---

## 📈 Future Enhancements

- [ ] Custom aliases
- [ ] Analytics & click tracking
- [ ] Expiring URLs
- [ ] Admin dashboard
- [ ] Rate limiting
- [ ] Authentication
- [x] Health check probes
- [ ] Prometheus metrics
- [ ] Grafana dashboards

---

## 🤝 Contributing

```bash
git checkout -b feature/amazing-feature
git commit -m 'Add some amazing feature'
git push origin feature/amazing-feature
```

Then open a Pull Request ✨

---

## 📄 License

ISC License

---

## 👥 Support

- Open an issue
- Check logs or troubleshooting above
- PRs welcome!
