# Admin dependencies
FROM node:22-alpine AS admin-deps
WORKDIR /app
COPY apps/admin/package*.json ./
RUN npm ci

# Admin development server
FROM node:22-alpine AS admin-dev
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=admin-deps /app/node_modules ./node_modules
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Admin production build
FROM node:22-alpine AS admin-build
WORKDIR /app
COPY --from=admin-deps /app/node_modules ./node_modules
COPY apps/admin/ ./
ARG VITE_APP_NAME=AIDN
ARG VITE_APP_VERSION=0.1.1
ARG VITE_ENV=production
ARG VITE_DATA_MODE=api
ARG VITE_API_BASE_URL
ARG VITE_SPLASH_ENABLED=true
ARG VITE_SPLASH_MIN_MS=800
ARG VITE_SPLASH_MAX_MS=2500
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ENV=$VITE_ENV
ENV VITE_DATA_MODE=$VITE_DATA_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SPLASH_ENABLED=$VITE_SPLASH_ENABLED
ENV VITE_SPLASH_MIN_MS=$VITE_SPLASH_MIN_MS
ENV VITE_SPLASH_MAX_MS=$VITE_SPLASH_MAX_MS
RUN npm run build

# Admin production runtime
FROM nginx:1.27-alpine AS admin-prod
COPY infra/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=admin-build /app/dist /usr/share/nginx/html
EXPOSE 80

# API dependencies
FROM node:22-alpine AS api-deps
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci

# API development server
FROM node:22-alpine AS api-dev
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=api-deps /app/node_modules ./node_modules
EXPOSE 4400
CMD ["npx", "tsx", "watch", "src/server.ts"]

# API production build
FROM node:22-alpine AS api-build
WORKDIR /app
COPY --from=api-deps /app/node_modules ./node_modules
COPY apps/api/ ./
RUN npm run build

# API production runtime
FROM node:22-alpine AS api-prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4400
COPY apps/api/package*.json ./
RUN npm ci --omit=dev
COPY --from=api-build /app/dist ./dist
RUN mkdir -p storage && chown -R node:node /app
USER node
EXPOSE 4400
CMD ["node", "dist/server.js"]

# Portal dependencies
FROM node:22-alpine AS portal-deps
WORKDIR /app
COPY apps/portal/package*.json ./
RUN npm ci

# Portal development server
FROM node:22-alpine AS portal-dev
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=portal-deps /app/node_modules ./node_modules
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# Portal production build
FROM node:22-alpine AS portal-build
WORKDIR /app
COPY --from=portal-deps /app/node_modules ./node_modules
COPY apps/portal/ ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Portal production runtime
FROM nginx:1.27-alpine AS portal-prod
COPY infra/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=portal-build /app/dist /usr/share/nginx/html
EXPOSE 80
