# ============================================================================
# 壹页简历 — 生产镜像（多阶段构建）
#
# 关键点：
#  1. 前端 VITE_* 变量在构建期打进 bundle（import.meta.env），
#     必须通过 build ARG 传入；运行时注入的 service_role 等 secret
#     绝不会进入前端 bundle，杜绝密钥泄漏。
#  2. 服务端在运行时从环境变量读取（dotenv 不覆盖已注入的 env）。
# ============================================================================

# ── 阶段一：构建 ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# 前端构建期变量（只暴露 URL 与 anon key，都是公开安全的）
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── 阶段二：运行 ──────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
