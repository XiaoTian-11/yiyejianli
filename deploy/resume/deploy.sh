#!/usr/bin/env bash
# ============================================================================
# 壹页简历 一键部署脚本（本机 Windows/Linux 运行）
#
# 用法：bash deploy/resume/deploy.sh <服务器IP或域名> [SSH用户]
# 示例：bash deploy/resume/deploy.sh 1.2.3.4 root
#
# 前置：
#   1. 服务器上已配置 /var/www/yiyejianli/.env（Supabase/支付/DeepSeek 密钥）
#      （可参照 docs/壹页简历部署-拼团共存版.md 或 .env.example）
#   2. 服务器已装 Node 20 + PM2 + Nginx（谷团宝 init.sh 已装过，无需重复）
#   3. 域名 resume.xnkun.com 已解析到服务器公网 IP
#
# 流程：本机构建（前端+admin+server.cjs）→ tar 上传源码+dist
#       → 服务器 npm ci --omit=dev（装生产依赖，不吃内存，2G 无压力）
#       → pm2 启动/重启 → 验证健康检查
#
# 注意：不在服务器构建（vite build 吃内存，2G 机器会卡死，拼团已踩过坑）
# ============================================================================
set -euo pipefail

SERVER="${1:-}"
SSH_USER="${2:-root}"

if [[ -z "$SERVER" ]]; then
  echo "用法: bash deploy/resume/deploy.sh <服务器IP或域名> [SSH用户]"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SSH="ssh -o StrictHostKeyChecking=accept-new"
REMOTE_DIR="/var/www/yiyejianli"

echo "=============================================="
echo " 壹页简历 部署到 $SSH_USER@$SERVER"
echo "=============================================="

# ---------- 1. 本机构建 ----------
echo ">>> [1/4] 构建前端 + admin + server.cjs..."
(cd "$ROOT" && npm run build >/dev/null && npm --prefix admin run build >/dev/null)
echo "    ✅ 构建完成（dist/ 与 dist/admin/ 就绪）"

# ---------- 2. 上传 ----------
echo ">>> [2/4] 上传源码 + dist 到 $REMOTE_DIR..."
$SSH "$SSH_USER@$SERVER" "mkdir -p $REMOTE_DIR/logs"

# 打包部署所需：源码（server 相关）+ dist + 配置；排除 node_modules（服务器 npm ci 装）
# .env 排除（服务器 .env 单独维护，不被覆盖）；admin/node_modules 排除（本地 admin 依赖，几百 MB）
tar czf - \
  --exclude='node_modules' \
  --exclude='admin/node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='dist' \
  --exclude='*.log' \
  -C "$ROOT" . 2>/dev/null | \
  $SSH "$SSH_USER@$SERVER" "tar xzf - -C $REMOTE_DIR"

# dist 单独打包（避免重复遍历 node_modules）
tar czf - -C "$ROOT" dist 2>/dev/null | \
  $SSH "$SSH_USER@$SERVER" "tar xzf - -C $REMOTE_DIR"

# ecosystem 配置复制到部署根目录（PM2 启动时从 cwd 找它）
$SSH "$SSH_USER@$SERVER" "cp $REMOTE_DIR/deploy/resume/ecosystem.config.cjs $REMOTE_DIR/ecosystem.config.cjs"

echo "    ✅ 上传完成"

# ---------- 3. 服务器安装生产依赖 + PM2 ----------
echo ">>> [3/4] 服务器 npm ci（生产依赖）+ PM2 启动..."
$SSH "$SSH_USER@$SERVER" "cd $REMOTE_DIR && \
  npm ci --omit=dev --no-audit --no-fund --loglevel=error && \
  (pm2 start ecosystem.config.cjs 2>/dev/null || pm2 restart yiyejianli) && \
  pm2 save"

echo "    ✅ PM2 就绪"

# ---------- 4. 验证 ----------
echo ">>> [4/4] 健康检查..."
sleep 2
$SSH "$SSH_USER@$SERVER" "curl -s -m 5 http://127.0.0.1:3001/api/health || echo '⚠️ 健康检查失败，查看日志: pm2 logs yiyejianli'"

echo ""
echo "=============================================="
echo " ✅ 壹页简历部署完成"
echo "    PM2 状态: pm2 status"
echo "    本机验证: curl http://127.0.0.1:3001/api/health"
echo "    线上验证: https://resume.xnkun.com/api/health"
echo "    （Nginx 站点配置需首次手动安装，见 docs/壹页简历部署-拼团共存版.md §4）"
echo "=============================================="
