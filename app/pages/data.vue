<script setup lang="ts">
useHead({ title: 'Data Analytics — Claude Agents Manager' })

const dashboardUrl = ref('http://localhost:8501')
const isLoading = ref(true)
const iframeRef = ref<HTMLIFrameElement | null>(null)

const tabs = [
  { id: 'chat', label: 'AI Analyst', icon: 'i-lucide-message-square' },
  { id: 'dashboard', label: 'Dashboard', icon: 'i-lucide-bar-chart-3' },
  { id: 'workspace', label: 'Workspace', icon: 'i-lucide-folder' },
  { id: 'agent', label: 'Agent Info', icon: 'i-lucide-bot' },
]
const activeTab = ref('chat')

function reloadDashboard() {
  isLoading.value = true
  if (iframeRef.value) iframeRef.value.src = iframeRef.value.src
}

function openInNewTab() {
  window.open(dashboardUrl.value, '_blank')
}

// ---------- AI Chat (reuse useStudioChat) ----------
import type { ChatMessage as ChatMessageType } from '~/types'

const {
  messages,
  isStreaming,
  activity,
  toolCalls,
  error: chatError,
  sendMessage,
  stopStreaming: stopStream,
  clearChat,
} = useStudioChat()

// Direct access to messages state for setting/replacing
const messagesState = useState<ChatMessageType[]>('studio-chat-messages', () => [])

const chatInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const sidebarOpen = ref(true)

// Game selector — persist across reloads
const selectedGame = useState<'president' | 'pusoy'>('datanalyst-game', () => 'pusoy')

// ---------- Chat History ----------
const {
  conversations,
  activeId,
  loadFromStorage,
  newConversation,
  upsertActive,
  loadConversation,
  deleteConversation,
} = useDataChatHistory()

// Restore on mount
onMounted(() => {
  loadFromStorage()
  if (!activeId.value && !messages.value.length) {
    newConversation(selectedGame.value)
  } else if (activeId.value) {
    const conv = conversations.value.find(c => c.id === activeId.value)
    if (conv) {
      messagesState.value = [...conv.messages]
      selectedGame.value = conv.game
    }
  }
})

// Auto-save messages to active conversation
watch(messages, (val) => {
  if (activeId.value && val.length > 0) {
    upsertActive([...val] as ChatMessageType[], selectedGame.value)
  }
}, { deep: true })

function startNewConversation() {
  if (isStreaming.value) stopStream()
  clearChat()
  newConversation(selectedGame.value)
}

function switchConversation(id: string) {
  if (isStreaming.value) stopStream()
  const conv = loadConversation(id)
  if (conv) {
    messagesState.value = [...conv.messages]
    selectedGame.value = conv.game
  }
}

function removeConversation(id: string, e: Event) {
  e.stopPropagation()
  const wasActive = activeId.value === id
  deleteConversation(id)
  if (wasActive) {
    clearChat()
    if (conversations.value.length > 0) {
      switchConversation(conversations.value[0]!.id)
    } else {
      newConversation(selectedGame.value)
    }
  }
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

const gameMeta = {
  president: {
    label: 'President (Big2)',
    db: 'president_db',
    emoji: '👑',
    color: 'bg-purple-500',
  },
  pusoy: {
    label: 'Pusoy',
    db: 'pusoy_ph_db',
    emoji: '🃏',
    color: 'bg-blue-500',
  },
}

const statusText = computed(() => {
  if (!isStreaming.value) return ''
  if (activity.value?.type === 'tool') return `Running ${(activity.value as any).name || 'tool'}...`
  if (activity.value?.type === 'thinking') return 'Đang suy nghĩ...'
  return 'Đang generate...'
})

function prefixWithGame(text: string): string {
  const g = gameMeta[selectedGame.value]
  return `[Game: ${selectedGame.value} | DB: ${g.db}]\n\n${text}`
}

async function send() {
  const text = chatInput.value.trim()
  if (!text || isStreaming.value) return
  chatInput.value = ''
  await sendMessage(prefixWithGame(text), { agentSlug: 'datanalyst' })
  scrollToBottom()
}

async function quickAsk(prompt: string) {
  if (isStreaming.value) return
  await sendMessage(prefixWithGame(prompt), { agentSlug: 'datanalyst' })
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

const quickActions = computed(() => {
  const isPresident = selectedGame.value === 'president'
  return [
    {
      label: '📊 Revenue 7 ngày',
      prompt: `Phân tích revenue 7 ngày qua, có dip/spike gì không? Breakdown theo market + platform.`,
    },
    {
      label: '🌍 Top markets',
      prompt: `So sánh top 5 market theo revenue 14 ngày qua. Market nào tăng/giảm?`,
    },
    {
      label: '💰 Gold-in source',
      prompt: isPresident
        ? 'Top gold-in sources 7 ngày qua từ raw_log action=UpdateMoney. Source nào tăng mạnh nhất?'
        : 'Top gold-in sources Pusoy 7 ngày qua. POT cycling vs paid sources contribute thế nào?',
    },
    {
      label: '🎯 Top whales',
      prompt: 'Top 10 paying users 30 ngày qua: ARPPU + total_paid + last_stake + market.',
    },
    {
      label: '🆕 New user trend',
      prompt: 'N1 (new install) 14 ngày qua theo ngày × market. Có tăng/giảm gì không?',
    },
    {
      label: '📈 LTV cohort',
      prompt: 'LTV cohort install_month last 6 months, M0-M6 cumulative, breakdown platform.',
    },
  ]
})

// ---------- Workspace info ----------
const workspaceFiles = [
  { path: '/Users/lap60412/Simulation/analytics/', label: 'Workspace root' },
  { path: '/Users/lap60412/Simulation/analytics/workspace.json', label: '8 games registry' },
  { path: '/Users/lap60412/Simulation/analytics/games/president.md', label: 'Big2 schema + KPI' },
  { path: '/Users/lap60412/Simulation/analytics/games/pusoy.md', label: 'Pusoy schema + KPI' },
  { path: '/Users/lap60412/Simulation/analytics/queries/', label: 'SQL templates' },
  { path: '/Users/lap60412/Simulation/analytics/reports/', label: 'Output reports' },
]

const gameRegistry = [
  { key: 'president', name: 'President (Big2)', db: 'president_db', status: 'ready' },
  { key: 'pusoy', name: 'Pusoy multi-market', db: 'pusoy_ph_db', status: 'ready' },
  { key: 'p2', name: 'P2', db: 'p2_db', status: 'tbd' },
  { key: 'p13', name: 'P13', db: 'p13_db', status: 'tbd' },
  { key: 'banting', name: 'Banting', db: 'bantingdn_db', status: 'tbd' },
  { key: 'daudiachu', name: 'Đấu Địa Chủ', db: 'daudiachudn_db', status: 'tbd' },
  { key: 'rummy', name: 'Rummy', db: 'rummydn_db', status: 'tbd' },
  { key: 'susun', name: 'Susun', db: 'susundn_db', status: 'tbd' },
]
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Compact header: title + tabs + actions trong 1 row -->
    <div class="flex items-center gap-4 px-4 py-1.5 border-b border-gray-200 dark:border-gray-800">
      <h1 class="text-sm font-semibold flex items-center gap-1.5 shrink-0">
        <Icon name="i-lucide-bar-chart-3" class="w-4 h-4" />
        Data
      </h1>

      <!-- Tabs inline -->
      <div class="flex items-center gap-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1"
          :class="activeTab === tab.id
            ? 'bg-blue-500 text-white'
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" class="w-3.5 h-3.5" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Game selector inline (chỉ show ở tab chat) -->
      <div v-if="activeTab === 'chat'" class="flex items-center gap-1.5 ml-2 pl-3 border-l border-gray-200 dark:border-gray-800">
        <button
          v-for="g in (['president', 'pusoy'] as const)"
          :key="g"
          class="px-2 py-1 text-xs font-medium rounded transition flex items-center gap-1"
          :class="selectedGame === g
            ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
          @click="selectedGame = g"
        >
          <span>{{ gameMeta[g].emoji }}</span>
          <span>{{ gameMeta[g].label }}</span>
        </button>
      </div>

      <div class="flex-1" />

      <!-- Action buttons -->
      <div class="flex items-center gap-1">
        <template v-if="activeTab === 'dashboard'">
          <button
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Reload" @click="reloadDashboard"
          ><Icon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" /></button>
          <button
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Open in new tab" @click="openInNewTab"
          ><Icon name="i-lucide-external-link" class="w-3.5 h-3.5" /></button>
        </template>
        <template v-if="activeTab === 'chat'">
          <button
            v-if="messages.length"
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Clear chat" @click="clearChat"
          ><Icon name="i-lucide-trash-2" class="w-3.5 h-3.5" /></button>
        </template>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Tab: AI Chat -->
      <div v-if="activeTab === 'chat'" class="h-full flex">
        <!-- Conversations sidebar (compact) -->
        <aside
          v-if="sidebarOpen"
          class="w-52 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/30"
        >
          <div class="px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Chats</span>
            <button
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
              title="New conversation"
              @click="startNewConversation"
            >
              <Icon name="i-lucide-plus" class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              v-for="conv in conversations"
              :key="conv.id"
              class="w-full text-left px-2.5 py-2 rounded-md text-xs transition group relative"
              :class="conv.id === activeId
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
              @click="switchConversation(conv.id)"
            >
              <div class="flex items-start gap-2">
                <span class="shrink-0 mt-0.5">{{ gameMeta[conv.game]?.emoji || '🎮' }}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ conv.title }}</div>
                  <div class="text-[10px] text-gray-500 mt-0.5">
                    {{ formatRelativeTime(conv.updatedAt) }} · {{ conv.messages.length }} msg
                  </div>
                </div>
                <button
                  class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 transition"
                  title="Delete"
                  @click="removeConversation(conv.id, $event)"
                >
                  <Icon name="i-lucide-trash-2" class="w-3 h-3 text-red-500" />
                </button>
              </div>
            </button>
            <div v-if="!conversations.length" class="text-center py-8 text-xs text-gray-400">
              No conversations yet
            </div>
          </div>
        </aside>

        <!-- Main chat area (max space) -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- Quick actions (only when empty) -->
          <div v-if="!messages.length" class="flex-1 flex items-center justify-center px-6">
            <div class="w-full max-w-2xl">
              <div class="text-center mb-4">
                <Icon name="i-lucide-bot" class="w-8 h-8 mx-auto text-blue-500 mb-1" />
                <h2 class="text-base font-semibold">
                  Datanalyst —
                  <span :class="selectedGame === 'president' ? 'text-purple-600' : 'text-blue-600'">
                    {{ gameMeta[selectedGame].emoji }} {{ gameMeta[selectedGame].label }}
                  </span>
                </h2>
                <p class="text-[11px] text-gray-500 mt-0.5">
                  MCP bi-tool · DB: <code>{{ gameMeta[selectedGame].db }}</code>
                </p>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="qa in quickActions"
                  :key="qa.label"
                  class="px-3 py-2 text-left border border-gray-200 dark:border-gray-800 rounded hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                  @click="quickAsk(qa.prompt)"
                >
                  <div class="text-xs font-medium">{{ qa.label }}</div>
                  <div class="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{{ qa.prompt }}</div>
                </button>
              </div>
            </div>
          </div>

          <!-- Messages (full width) -->
          <div
            v-else
            ref="messagesContainer"
            class="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            <ChatMessage
              v-for="msg in messages"
              :key="msg.id"
              :message="msg"
              :is-streaming="isStreaming && msg === messages[messages.length - 1]"
              :activity="activity"
              :status-text="statusText"
            />
            <div v-if="chatError" class="rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-2 text-xs text-red-700 dark:text-red-300">
              {{ chatError }}
            </div>
          </div>

          <!-- Compact input -->
          <div class="border-t border-gray-200 dark:border-gray-800 px-3 py-2">
            <div class="flex items-end gap-1.5">
              <button
                class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
                :title="sidebarOpen ? 'Hide chats' : 'Show chats'"
                @click="sidebarOpen = !sidebarOpen"
              >
                <Icon :name="sidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" class="w-3.5 h-3.5" />
              </button>
              <textarea
                v-model="chatInput"
                rows="1"
                placeholder="Hỏi về data... (Enter gửi, Shift+Enter xuống dòng)"
                class="flex-1 resize-none px-2.5 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500"
                :disabled="isStreaming"
                @keydown.enter.exact.prevent="send"
              />
              <button
                v-if="!isStreaming"
                class="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
                :disabled="!chatInput.trim()"
                @click="send"
              >
                <Icon name="i-lucide-send" class="w-3.5 h-3.5" /> Send
              </button>
              <button
                v-else
                class="px-3 py-1.5 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-1 shrink-0"
                @click="stopStream"
              >
                <Icon name="i-lucide-square" class="w-3.5 h-3.5" /> Stop
              </button>
            </div>
            <div v-if="toolCalls.length" class="text-[10px] text-gray-400 mt-1 text-right">
              {{ toolCalls.length }} tool calls
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Dashboard -->
      <div v-else-if="activeTab === 'dashboard'" class="h-full relative">
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-10 bg-white dark:bg-gray-900">
          <div class="text-center">
            <Icon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p class="text-sm text-gray-500 mt-3">Loading Streamlit dashboard...</p>
          </div>
        </div>
        <iframe
          ref="iframeRef"
          :src="dashboardUrl"
          class="w-full h-full border-0"
          @load="isLoading = false"
        />
      </div>

      <!-- Tab: Workspace Info -->
      <div v-else-if="activeTab === 'workspace'" class="p-6 overflow-y-auto h-full">
        <div class="max-w-3xl">
          <h2 class="text-base font-semibold mb-3">📁 Workspace Structure</h2>
          <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-6">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Path</th>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in workspaceFiles" :key="f.path" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-4 py-2 font-mono text-xs">{{ f.path }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ f.label }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="text-base font-semibold mb-3">🎮 Game Registry</h2>
          <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Key</th>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Game</th>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Database</th>
                  <th class="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in gameRegistry" :key="g.key" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-4 py-2 font-mono text-xs">{{ g.key }}</td>
                  <td class="px-4 py-2">{{ g.name }}</td>
                  <td class="px-4 py-2 font-mono text-xs text-gray-500">{{ g.db }}</td>
                  <td class="px-4 py-2">
                    <span
                      class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      :class="g.status === 'ready'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'"
                    >
                      {{ g.status === 'ready' ? '✅ ready' : '⚠️ tbd' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: Datanalyst Agent -->
      <div v-else-if="activeTab === 'agent'" class="p-6 overflow-y-auto h-full">
        <div class="max-w-2xl">
          <h2 class="text-base font-semibold mb-3 flex items-center gap-2">
            <Icon name="i-lucide-bot" class="w-4 h-4" />
            Datanalyst Agent
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Senior Game Data Analyst với access MCP bi-tool. Workflow strict 6 bước theo skill <code class="text-xs">game-data-analyst</code>.
          </p>

          <NuxtLink
            to="/agents/datanalyst"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
          >
            <Icon name="i-lucide-edit-3" class="w-4 h-4" />
            Edit Agent
          </NuxtLink>

          <div class="mt-6 space-y-4">
            <div class="border-l-4 border-blue-500 pl-3">
              <div class="text-xs font-medium text-gray-500 mb-1">SKILLS</div>
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">game-data-analyst</span>
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">game-context</span>
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">game-sql</span>
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">analyst</span>
              </div>
            </div>
            <div class="border-l-4 border-purple-500 pl-3">
              <div class="text-xs font-medium text-gray-500 mb-1">MCP TOOLS</div>
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">run-sql</span>
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">list-databases</span>
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">list-tables</span>
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">run-sql-async</span>
              </div>
            </div>
            <div class="border-l-4 border-green-500 pl-3">
              <div class="text-xs font-medium text-gray-500 mb-1">WORKFLOWS</div>
              <div class="flex flex-col gap-1">
                <NuxtLink to="/workflows" class="text-sm text-blue-600 hover:underline">Game Data Analysis Pipeline (8 steps)</NuxtLink>
                <NuxtLink to="/workflows" class="text-sm text-blue-600 hover:underline">User Deep Dive (5 steps)</NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
