# ─── Admin deps ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS admin-deps
WORKDIR /app
COPY apps/admin/package*.json ./
RUN npm ci

# ─── Admin dev ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS admin-dev
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=admin-deps /app/node_modules ./node_modules
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ─── API deps ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS api-deps
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci

# ─── API dev ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS api-dev
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=api-deps /app/node_modules ./node_modules
EXPOSE 4000
CMD ["npx", "tsx", "watch", "src/server.ts"]

# ─── Portal deps ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS portal-deps
WORKDIR /app
COPY apps/portal/package*.json ./
RUN npm ci

# ─── Portal dev ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS portal-dev
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=portal-deps /app/node_modules ./node_modules
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
