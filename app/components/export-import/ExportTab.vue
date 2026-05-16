<script setup lang="ts">
const emit = defineEmits<{
  exported: []
}>()

const toast = useToast()

interface ExportPreview {
  agents: number
  commands: number
  skills: number
  workflows: number
}

const exportPreview = ref<ExportPreview | null>(null)
const includeSettings = ref(true)
const exporting = ref(false)
const loadingPreview = ref(false)

async function fetchExportPreview() {
  loadingPreview.value = true
  try {
    const data = await $fetch<{
      agents: unknown[]
      commands: unknown[]
      skills: unknown[]
      workflows: unknown[]
    }>('/api/export', {
      query: { includeSettings: 'false' },
    })
    exportPreview.value = {
      agents: data.agents?.length ?? 0,
      commands: data.commands?.length ?? 0,
      skills: data.skills?.length ?? 0,
      workflows: data.workflows?.length ?? 0,
    }
  } catch {
    exportPreview.value = null
  } finally {
    loadingPreview.value = false
  }
}

async function downloadConfig() {
  exporting.value = true
  try {
    const data = await $fetch('/api/export', {
      query: { includeSettings: includeSettings.value ? 'true' : 'false' },
    })

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().split('T')[0]
    const a = document.createElement('a')
    a.href = url
    a.download = `claude-config-${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.add({ title: 'Config exported', color: 'success' })
    emit('exported')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export failed'
    toast.add({ title: 'Export failed', description: msg, color: 'error' })
  } finally {
    exporting.value = false
  }
}

// Expose refresh for parent to call when tab becomes active
defineExpose({ fetchExportPreview })
</script>

<template>
  <div class="space-y-4">
    <p class="text-[12px] text-label leading-relaxed">
      Export all your agents, commands, skills, and workflows as a single JSON file that can be imported later.
    </p>

    <!-- Preview counts -->
    <div
      class="rounded-xl p-4"
      style="background: var(--surface-raised); border: 1px solid var(--border-default);"
    >
      <div v-if="loadingPreview" class="flex items-center gap-2 text-[12px] text-meta">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        Loading preview...
      </div>
      <div v-else-if="exportPreview" class="grid grid-cols-2 gap-3">
        <div
          v-for="[key, val] in Object.entries(exportPreview)"
          :key="key"
          class="flex items-center gap-2"
        >
          <span
            class="inline-flex items-center justify-center size-7 rounded-lg text-[12px] font-bold"
            style="background: var(--accent-subtle, rgba(99,102,241,0.1)); color: var(--accent);"
          >
            {{ val }}
          </span>
          <span class="text-[12px] text-body capitalize">{{ key }}</span>
        </div>
      </div>
      <div v-else class="flex justify-center">
        <UButton label="Load preview" size="xs" variant="ghost" @click="fetchExportPreview" />
      </div>
    </div>

    <!-- Include settings toggle -->
    <label class="flex items-center gap-3 cursor-pointer">
      <input v-model="includeSettings" type="checkbox" class="shrink-0" />
      <div>
        <div class="text-[13px] font-medium">Include settings.json</div>
        <div class="text-[11px] text-meta mt-0.5">Exports Claude settings (model, hooks, etc.)</div>
      </div>
    </label>

    <div class="flex justify-end pt-1">
      <UButton
        label="Download Config"
        icon="i-lucide-download"
        size="sm"
        :loading="exporting"
        @click="downloadConfig"
      />
    </div>
  </div>
</template>
