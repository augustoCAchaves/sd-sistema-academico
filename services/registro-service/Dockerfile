FROM node:24-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter @academico/registro-service...
RUN pnpm --filter @academico/registro-service... build

WORKDIR /app/services/registro-service
ENV GRPC_PORT=50052 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
EXPOSE 50052
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec node dist/main.js"]
