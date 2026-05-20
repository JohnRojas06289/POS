# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/db-types/package.json ./packages/db-types/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile --filter backend --filter @nexus/db-types --filter @nexus/core

COPY backend/ ./backend/
COPY packages/ ./packages/

RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/db-types/package.json ./packages/db-types/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile --filter backend --filter @nexus/db-types --filter @nexus/core --prod

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

EXPOSE 3001

CMD ["node", "backend/dist/main.js"]
