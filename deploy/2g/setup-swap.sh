#!/usr/bin/env bash
# ============================================================================
# 2核2G 专用：配置 2G swap（内存兜底）
#
# 用法：sudo bash setup-swap.sh
# 效果：新建 2G swap 文件，系统内存到顶时换页，防止 OOM 杀进程
#       2G 内存 + 2G swap = Postgres + 应用的高峰期有缓冲
# ============================================================================
set -euo pipefail

SWAP_FILE=/swapfile
SIZE_MB=2048

echo "==> 创建 ${SIZE_MB}MB swap 文件：${SWAP_FILE}"
if [ -f "$SWAP_FILE" ]; then
  echo "   已存在，跳过创建。"
else
  fallocate -l ${SIZE_MB}M "$SWAP_FILE"
  chmod 600 "$SWAP_FILE"
fi

echo "==> 启用 swap"
if swapon --show | grep -q "$SWAP_FILE"; then
  echo "   已启用。"
else
  mkswap "$SWAP_FILE"
  swapon "$SWAP_FILE"
fi

echo "==> 写入 /etc/fstab 开机自动挂载"
if ! grep -q "$SWAP_FILE" /etc/fstab; then
  echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  echo "   已写入 fstab。"
else
  echo "   fstab 已配置。"
fi

# 调低 swap 使用倾向：内存还有余时优先用内存，只有接近满才换页
echo "==> 设置 vm.swappiness=10（默认 60，越低越优先用内存）"
sysctl -w vm.swappiness=10 >/dev/null
if ! grep -q "vm.swappiness" /etc/sysctl.conf 2>/dev/null; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
fi

echo ""
echo "✅ swap 配置完成。当前状态："
swapon --show
free -h
