<!-- JavaScript,NodeJS,Express,Docker -->

# Fragments API

A cloud-native REST microservice for storing small pieces of text and image data ("fragments") and converting them between formats on the fly. Built with Node.js and Express, containerised with Docker, and deployed to AWS through a full CI/CD pipeline.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-S3_|_DynamoDB_|_ECS_|_Cognito-232F3E?logo=amazonwebservices&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

## Architecture

```
Client ──► Express API (Docker container on Amazon ECS)
             │  auth: Amazon Cognito JWT (prod) / HTTP Basic (dev & tests)
             ├──► Amazon DynamoDB   fragment metadata
             └──► Amazon S3         fragment data
```

- **Pluggable storage** – an in-memory database for local development, or S3 + DynamoDB when `AWS_REGION` is set.
- **Privacy** – owners are identified by a SHA-256 hash of their email, never the raw address.
- **Hardened server** – Helmet, CORS, gzip compression and structured logging with Pino.

## API

All `/v1` routes require authentication.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Health check (version, author, hostname) |
| `GET` | `/v1/fragments` | List the user's fragment IDs (`?expand=1` for full metadata) |
| `GET` | `/v1/fragments/all` | List fragments from all users |
| `POST` | `/v1/fragments` | Create a fragment from the raw request body (up to 5 MB); returns `201` with a `Location` header |
| `GET` | `/v1/fragments/:id` | Get a fragment's data |
| `GET` | `/v1/fragments/:id.:ext` | Get a fragment converted to another format (e.g. `.html`, `.png`) |
| `GET` | `/v1/fragments/:id/info` | Get a fragment's metadata |
| `PUT` | `/v1/fragments/:id` | Replace a fragment's data |
| `DELETE` | `/v1/fragments/:id` | Delete a fragment |

### Supported types and conversions

| Type | Can be returned as |
| --- | --- |
| `text/plain` | `.txt` |
| `text/markdown` | `.md`, `.html`, `.txt` |
| `text/html` | `.html`, `.txt` |
| `text/csv` | `.csv`, `.txt`, `.json` |
| `application/json` | `.json`, `.txt` |
| `application/yaml` | `.yaml`, `.txt` |
| `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/avif` | any of `.png`, `.jpg`, `.webp`, `.gif`, `.avif` |

Conversions use `markdown-it`, `turndown`, `papaparse`, `js-yaml` and `sharp`.

## Testing

- **Unit tests** – Jest + Supertest covering the model, in-memory database, routes and responses (`npm test`, `npm run coverage`).
- **Integration tests** – [Hurl](https://hurl.dev) scenarios run against the full Docker Compose stack with **LocalStack (S3)** and **DynamoDB Local** (`npm run test:integration`).

## CI/CD

| Workflow | Trigger | Steps |
| --- | --- | --- |
| `ci.yml` | Push / PR to `main` | ESLint → Hadolint (Dockerfile) → unit tests → integration tests → build and push image to Docker Hub |
| `cd.yml` | Tag `v*` | Build and push image to Amazon ECR → render ECS task definition → deploy to Amazon ECS |

## Getting started

### Run locally (in-memory storage)

```bash
git clone https://github.com/alisedighmoghadam/fragments.git
cd fragments
npm install
```

Create a `.env` file:

```bash
PORT=8080
LOG_LEVEL=debug
HTPASSWD_FILE=tests/.htpasswd
```

```bash
npm run dev        # nodemon with debug logging
npm run debug      # same, with the inspector on port 9229
curl -s http://localhost:8080 | jq
```

### Run the full stack with Docker Compose

```bash
docker compose up -d --build
./scripts/local-aws-setup.sh     # creates the S3 bucket and DynamoDB table
npm run test:integration
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port (default `8080`) |
| `LOG_LEVEL` | Pino log level (`info`, `debug`, …) |
| `API_URL` | Public base URL used in `Location` headers |
| `HTPASSWD_FILE` | HTTP Basic auth users (development and tests only) |
| `AWS_COGNITO_POOL_ID`, `AWS_COGNITO_CLIENT_ID` | Cognito JWT auth (production) |
| `AWS_REGION` | Enables the AWS storage backend |
| `AWS_S3_BUCKET_NAME`, `AWS_DYNAMODB_TABLE_NAME` | Storage locations |
| `AWS_S3_ENDPOINT_URL`, `AWS_DYNAMODB_ENDPOINT_URL` | Local endpoints for LocalStack / DynamoDB Local |

## Project structure

```
src/
├── auth/            # Cognito and HTTP Basic strategies (Passport)
├── model/
│   ├── fragment.js  # Fragment model and supported conversions
│   └── data/        # memory/ and aws/ (S3 + DynamoDB) backends
├── routes/api/      # v1 route handlers
├── app.js           # Express app and middleware
└── server.js        # Graceful start/stop
tests/
├── unit/            # Jest
└── integration/     # Hurl
```

## Related

- [fragments-ui](https://github.com/alisedighmoghadam/fragments-ui) – Next.js front end for this API

Built for DPS955 (Cloud Computing for Programmers) at Seneca Polytechnic, Summer 2025.
