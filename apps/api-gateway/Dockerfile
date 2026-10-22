FROM node:24-slim

RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter @academico/api-gateway...
RUN pnpm --filter @academico/api-gateway... build

WORKDIR /app/apps/api-gateway
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
