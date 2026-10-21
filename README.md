# Sistema Acadêmico Distribuído

Trabalho 2 de **Sistemas Distribuídos** (INF/UFG). Evolui o
[Trabalho 1](https://github.com/augustoCAchaves/sd-matricula-grpc), um sistema
de matrícula com dois microsserviços gRPC, acrescentando uma camada de
exposição web completa:

```
Frontend (Vue) ──REST/JSON + JWT──▶ API Gateway (NestJS) ──gRPC──▶ registro-service  ─▶ PostgreSQL (registro_db)
                                                         ──gRPC──▶ matricula-service ─▶ PostgreSQL (matricula_db)
                                                                        └──gRPC──▶ registro-service
```

> 🚧 Em construção. Este README será completado ao longo das etapas.

## Estrutura

```
packages/contratos-grpc/     # .proto (fonte única dos contratos) + cliente gRPC compartilhado
services/registro-service/   # turmas, vagas, pré-requisitos (registro_db)
services/matricula-service/  # solicitação e registro de matrículas (matricula_db)
apps/api-gateway/            # REST: JWT, validação, tradução JSON ↔ Protobuf
apps/frontend/               # Vue 3 + Vite, servido por nginx
docker-compose.yml           # sobe tudo localmente
```

## Como rodar (por enquanto)

Pré-requisitos: Docker com Compose v2, Node 24 e pnpm (`corepack enable`).

```bash
cp .env.example .env
docker compose up -d        # sobe os dois bancos PostgreSQL
docker compose ps           # os dois devem aparecer como (healthy)
```
