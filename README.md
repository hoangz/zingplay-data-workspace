# ZingPlay Data Workspace

> Local web app cho game data analytics — chat với **datanalyst** agent, embed dashboards, MCP bi-tool integration.

Forked & stripped từ [hoangz/claude-agents-manager](https://github.com/hoangz/claude-agents-manager). Focus 1 use case: **data analysis** ZingPlay social casino games (President, Pusoy, Banting, Đấu Địa Chủ, Rummy, Susun, P2, P13).

## ✨ Tính năng

- 💬 **AI Chat** với `datanalyst` agent — workflow 6-bước theo skill `game-data-analyst`
- 🎮 **Game selector** — switch President/Pusoy 1 click
- 💾 **Chat history** persistent (localStorage, 50 conversations gần nhất)
- 📊 **Streamlit Dashboard** embed (port 8501)
- 🔌 **MCP bi-tool** — direct ClickHouse (run-sql, list-databases, list-tables)

## 🚀 Setup

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone + install
git clone git@github.com:hoangz/zingplay-data-workspace.git
cd zingplay-data-workspace
bun install

# Configure MCP bi-tool — add to ~/.claude.json:
# mcpServers.bi-tool with Bearer JWT from https://tracker.zingplay.com/mcp-gateway/

# Configure datanalyst agent — copy ~/.claude/agents/datanalyst.md

# Run
bun run dev
```

→ Open **http://localhost:3001**

## 🏗️ Stack

- Nuxt 3 + Vue 3 + TypeScript
- Bun runtime
- @anthropic-ai/claude-agent-sdk
- mcp-remote (npx) for MCP gateway

## 📁 Structure

```
app/pages/data.vue        — Main UI (4 tabs)
app/composables/
  useStudioChat.ts        — SSE chat
  useDataChatHistory.ts   — Persist conversations
server/api/chat.post.ts   — SSE endpoint (Claude Agent SDK)
```

## 📜 License

MIT
