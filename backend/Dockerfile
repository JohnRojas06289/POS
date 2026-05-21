FROM node:20-slim

RUN apt-get update && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app

RUN npm install -g pnpm@9

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/db-types/package.json ./packages/db-types/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile --filter backend --filter @nexus/db-types --filter @nexus/core

# Copy source
COPY backend/ ./backend/
COPY packages/ ./packages/

# Generate Prisma client and build
WORKDIR /app/backend
RUN npx prisma generate --schema=src/database/prisma/schema.prisma
RUN npx nest build

ENV NODE_ENV=production
EXPOSE 3001

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
