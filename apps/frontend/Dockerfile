FROM node:24-slim AS build

RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter @academico/frontend...
RUN pnpm --filter @academico/frontend build

FROM nginx:1.30-alpine

ENV GATEWAY_HOST=api-gateway:3000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY apps/frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
