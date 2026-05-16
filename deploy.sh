#!/bin/bash
# ============================================
# Claude Agents Manager — VPS Deploy Script
# Chạy: bash deploy.sh
# ============================================

set -e

APP_DIR="$HOME/claude-agents-manager"
APP_NAME="claude-agents"
PORT=3000

echo "🦊 Claude Agents Manager — Deploy Script"
echo "========================================="

# ── 1. Cài Bun nếu chưa có ──────────────────
if ! command -v bun &>/dev/null; then
  echo "📦 Cài Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
fi
echo "✅ Bun: $(bun --version)"

# ── 2. Cài Node/npm nếu chưa có (cần cho pm2) ─
if ! command -v npm &>/dev/null; then
  echo "📦 Cài Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# ── 3. Cài PM2 nếu chưa có ──────────────────
if ! command -v pm2 &>/dev/null; then
  echo "📦 Cài PM2..."
  npm install -g pm2
fi
echo "✅ PM2: $(pm2 --version)"

# ── 4. Clone hoặc pull repo ──────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "🔄 Cập nhật code mới nhất..."
  cd "$APP_DIR"
  git pull origin master
else
  echo "📥 Clone repo..."
  git clone https://github.com/hoangz/claude-agents-manager.git "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 5. Cài dependencies ──────────────────────
echo "📦 Cài dependencies..."
bun install

# ── 6. Build production ──────────────────────
echo "🔨 Build production..."
bun run build

# ── 7. Khởi động / restart PM2 ───────────────
echo "🚀 Khởi động app..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start "bun run preview --port $PORT" \
  --name "$APP_NAME" \
  --cwd "$APP_DIR" \
  --restart-delay 3000
pm2 save

# ── 8. Mở firewall ───────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow $PORT/tcp 2>/dev/null || true
fi

echo ""
echo "🎉 Deploy thành công!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URL: http://$(curl -s ifconfig.me):$PORT"
echo "📋 Logs: pm2 logs $APP_NAME"
echo "🔄 Restart: pm2 restart $APP_NAME"
echo "🛑 Stop: pm2 stop $APP_NAME"
echo ""
echo "⚠️  Lưu ý: App đọc ~/.claude/ trên VPS."
echo "   Nếu chưa có, tạo thư mục: mkdir -p ~/.claude/agents ~/.claude/skills ~/.claude/commands"
