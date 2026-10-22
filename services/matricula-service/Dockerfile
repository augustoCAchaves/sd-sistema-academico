FROM node:24-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter @academico/matricula-service...
RUN pnpm --filter @academico/matricula-service... build

WORKDIR /app/services/matricula-service
ENV GRPC_PORT=50051 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
EXPOSE 50051
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec node dist/main.js"]
