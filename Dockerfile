# Stage 1: Build
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# API_BASE_URL is a Vite build-time variable — must be injected here, not at runtime
ARG API_BASE_URL=""
ENV API_BASE_URL=$API_BASE_URL

COPY . .
RUN pnpm build

# Stage 2: Serve
FROM node:22-alpine AS runner

RUN npm install -g serve

COPY --from=builder /app/dist /dist

EXPOSE 3001

CMD ["serve", "-s", "/dist", "-l", "3001"]
