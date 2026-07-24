# ReWearMap

Interactive map of thrift stores in Warsaw — delivery schedules, ratings, filters, and navigation.

**Live demo:** [https://rewearmap.duckdns.org](https://rewearmap.duckdns.org)

## Features

- Interactive Leaflet map with custom markers by store priority
- Filtering by district, search query, upcoming deliveries, and unverified locations
- Sorting by hotness rating or distance from the user
- Geolocation support (distance to stores, locate-me on the map)
- Admin panel with JWT authentication for adding, editing, and removing stores
- Light and dark theme
- Responsive layout for desktop and mobile

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Leaflet
- **Backend:** FastAPI, SQLAlchemy (async), Pydantic, PyJWT
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker, Docker Compose, Nginx

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

### Run

```bash
git clone https://github.com/mkwkamil/ReWearMap.git
cd ReWearMap
cp .env.example .env
docker compose up --build -d
docker compose exec -T db psql -U rewear -d rewearmap < data/thrift_stores.sql
```

| Service | URL |
|---------|-----|
| App | http://localhost:8080 |
| API docs | http://localhost:8080/docs |

Default admin credentials are defined in `.env.example` — change them before use.

## Project Structure

```
ReWearMap/
├── backend/          # FastAPI application
│   └── app/
│       ├── api/      # Auth & thrift store endpoints
│       ├── models/   # SQLAlchemy models
│       ├── schemas/  # Pydantic schemas
│       └── services/ # Delivery schedule logic
├── frontend/         # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── auth/
│       ├── theme/
│       └── utils/
├── data/             # Seed dump (thrift_stores.sql)
└── docker-compose.yml
```

## API Overview

| Method | Endpoint | Access |
|--------|----------|--------|
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Admin |
| `GET` | `/api/thrift-stores` | Public |
| `POST` | `/api/thrift-stores` | Admin |
| `PATCH` | `/api/thrift-stores/{id}` | Admin |
| `DELETE` | `/api/thrift-stores/{id}` | Admin |
| `GET` | `/api/health` | Public |

## License

Private project.
