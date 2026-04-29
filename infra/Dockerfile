FROM node:22-alpine AS deps

WORKDIR /app

COPY apps/admin/package*.json ./
RUN npm ci

FROM node:22-alpine AS dev

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

COPY --from=deps /app/node_modules ./node_modules
COPY apps/admin/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
