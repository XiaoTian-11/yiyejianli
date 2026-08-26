#!/usr/bin/env bash
# ============================================================================
# 壹页简历 管理后台 独立子域名部署脚本（本机 Windows/Linux 运行）
#
# 用途：只更新 "管理后台"（dist/admin 后台UI + dist/server.cjs 含后台接口），
#       不改动主站 dist/（index.html 与 assets/）。适合把后台单独迁到
#       admin.resume.xnkun.com，且不携带未提交的 JSAPI 支付改动。
#
# 用法：bash deploy/resume/deploy-admin.sh <服务器IP或域名> [SSH用户]
# 示例：bash deploy/resume/deploy-admin.sh 1.2.3.4 root
#
# 与 deploy.sh 的区别：
#   - 本脚本不构建/上传主站 dist（不跑 vite build，避免 JSAPI 版主站覆盖线上）
#   - 只单独构建 server.cjs（esbuild）与 dist/admin（npm --prefix admin run build）
#   - 只上传 dist/server.cjs 与 dist/admin/**，其余一律不碰
#
# 注意：本机当前工作区的 src/App.tsx 含未提交的 JSAPI/禁用拦截改动，
#       本脚本刻意不构建主站，所以这些改动不会被推上线（符合"本次只上后台"）。
# ============================================================================
set -euo pipefail

SERVER="${1:-}"
SSH_USER="${2:-root}"

if [[ -z "$SERVER" ]]; then
  echo "用法: bash deploy/resume/deploy-admin.sh <服务器IP或域名> [SSH用户]"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SSH="ssh -o StrictHostKeyChecking=accept-new"
SCP="scp -o StrictHostKeyChecking=accept-new"
REMOTE_DIR="/var/www/yiyejianli"

echo "=============================================="
echo " 壹页简历 管理后台 部署到 $SSH_USER@$SERVER"
echo "=============================================="

# ---------- 1. 本机构建（仅后台，不跑主站 vite build） ----------
echo ">>> [1/4] 构建 server.cjs + dist/admin..."
cd "$ROOT"
npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs >/dev/null
npm --prefix admin run build >/dev/null
echo "    ✅ 构建完成（dist/server.cjs + dist/admin/）"

# ---------- 2. 上传（只传 server.cjs 与 dist/admin，不碰主站 dist） ----------
echo ">>> [2/4] 上传 dist/server.cjs + dist/admin 到 $REMOTE_DIR..."
$SSH "$SSH_USER@$SERVER" "mkdir -p $REMOTE_DIR/dist"

# dist/server.cjs（含后台接口后台 API 路由）→ 覆盖远端同名文件
tar czf - -C "$ROOT" dist/server.cjs 2>/dev/null | \
  $SSH "$SSH_USER@$SERVER" "tar xzf - -C $REMOTE_DIR"

# dist/admin/**（后台 SPA）→ 覆盖远端 dist/admin
$SSH "$SSH_USER@$SERVER" "mkdir -p $REMOTE_DIR/dist/admin"
tar czf - -C "$ROOT/dist" admin 2>/dev/null | \
  $SSH "$SSH_USER@$SERVER" "tar xzf - -C $REMOTE_DIR/dist"

echo "    ✅ 上传完成"

# ---------- 3. 重启 PM2 ----------
echo ">>> [3/4] PM2 重启 yiyejianli..."
$SSH "$SSH_USER@$SERVER" "pm2 restart yiyejianli && pm2 save"
echo "    ✅ PM2 就绪"

# ---------- 4. 验证 ----------
echo ">>> [4/4] 健康检查..."
sleep 2
$SSH "$SSH_USER@$SERVER" "curl -s -m 5 http://127.0.0.1:3001/api/health || echo '⚠️ 健康检查失败，查看日志: pm2 logs yiyejianli'"
echo "    ✅ 后台 server 已重启；nginx 站点（admin.resume.xnkun.com）需首次手动安装，见 admin-resume.conf 顶部注释"
