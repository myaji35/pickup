# syntax=docker/dockerfile:1
# Pickup MaaS — Next.js Admin Portal
# 빌드: docker build --platform linux/amd64 -t ghcr.io/myaji35/pickup_web .

FROM node:20-alpine AS base

# ── 의존성 설치 단계 ────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── 빌드 단계 ──────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 시 환경변수 (실제값은 런타임에 오버라이드)
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_OUTPUT=standalone

RUN npm run build

# ── 프로덕션 실행 단계 ─────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 nextjs

COPY --from=builder /app/public ./public

# standalone 출력 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
