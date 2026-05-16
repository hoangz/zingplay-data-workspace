<script setup lang="ts">
const emit = defineEmits<{
  imported: []
}>()

const toast = useToast()

interface ImportPreview {
  agents: number
  commands: number
  skills: number
  workflows: number
  hasSettings: boolean
}

interface ImportResult {
  imported: { agents: number; commands: number; skills: number; workflows: number }
  skipped: number
  errors: string[]
}

const importFile = ref<File | null>(null)
const importPreview = ref<ImportPreview | null>(null)
const importPayload = ref<Record<string, unknown> | null>(null)
const overwrite = ref(false)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)
const importError = ref('')
const isDragOver = ref(false)

function parseImportFile(file: File) {
  importFile.value = file
  importPreview.value = null
  importPayload.value = null
  importResult.value = null
  importError.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string)
      if (!parsed.version) {
        importError.value = 'Invalid file: missing version field'
        return
      }
      importPayload.value = parsed
      importPreview.value = {
        agents: Array.isArray(parsed.agents) ? parsed.agents.length : 0,
        commands: Array.isArray(parsed.commands) ? parsed.commands.length : 0,
        skills: Array.isArray(parsed.skills) ? parsed.skills.length : 0,
        workflows: Array.isArray(parsed.workflows) ? parsed.workflows.length : 0,
        hasSettings: !!parsed.settings && Object.keys(parsed.settings).length > 0,
      }
    } catch {
      importError.value = 'Failed to parse JSON file'
    }
  }
  reader.readAsText(file)
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) parseImportFile(file)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
    parseImportFile(file)
  } else if (file) {
    importError.value = 'Only .json files are supported'
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

async function doImport() {
  if (!importPayload.value) return
  importing.value = true
  importResult.value = null
  importError.value = ''

  try {
    const result = await $fetch<ImportResult>('/api/import', {
      method: 'POST',
      body: { ...importPayload.value, overwrite: overwrite.value },
    })
    importResult.value = result
    const total = result.imported.agents + result.imported.commands + result.imported.skills + result.imported.workflows
    toast.add({
      title: 'Import complete',
      description: `Imported ${total}, skipped ${result.skipped}`,
      color: 'success',
    })
    emit('imported')
  } catch (err: unknown) {
    const anyErr = err as { data?: { message?: string }; message?: string }
    importError.value = anyErr?.data?.message || anyErr?.message || 'Import failed'
    toast.add({ title: 'Import failed', description: importError.value, color: 'error' })
  } finally {
    importing.value = false
  }
}

function resetImport() {
  importFile.value = null
  importPreview.value = null
  importPayload.value = null
  importResult.value = null
  importError.value = ''
  overwrite.value = false
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-[12px] text-label leading-relaxed">
      Restore agents, commands, skills, and workflows from a previously exported config file.
    </p>

    <!-- Drop zone -->
    <div
      v-if="!importPreview && !importResult"
      class="relative rounded-xl border-2 border-dashed transition-colors cursor-pointer"
      :style="isDragOver
        ? 'border-color: var(--accent); background: var(--accent-subtle, rgba(99,102,241,0.06));'
        : 'border-color: var(--border-default); background: var(--surface-raised);'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <label class="flex flex-col items-center gap-2 px-6 py-8 cursor-pointer">
        <UIcon name="i-lucide-file-json" class="size-8 text-meta" />
        <div class="text-[13px] font-medium text-body">Drop JSON file here or click to browse</div>
        <div class="text-[11px] text-meta">Only .json export files are supported</div>
        <input
          type="file"
          accept=".json,application/json"
          class="sr-only"
          @change="onFileInput"
        />
      </label>
    </div>

    <!-- Import preview -->
    <div
      v-if="importPreview && !importResult"
      class="rounded-xl p-4 space-y-3"
      style="background: var(--surface-raised); border: 1px solid var(--border-default);"
    >
      <div class="flex items-center justify-between">
        <span class="text-[12px] font-medium text-body">{{ importFile?.name }}</span>
        <button class="text-[11px] text-meta hover:text-label" @click="resetImport">
          Change file
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="[key, val] in Object.entries({ agents: importPreview.agents, commands: importPreview.commands, skills: importPreview.skills, workflows: importPreview.workflows })"
          :key="key"
          class="flex items-center gap-2"
        >
          <span
            class="inline-flex items-center justify-center size-6 rounded text-[11px] font-bold"
            style="background: var(--accent-subtle, rgba(99,102,241,0.1)); color: var(--accent);"
          >
            {{ val }}
          </span>
          <span class="text-[12px] text-body capitalize">{{ key }}</span>
        </div>
      </div>

      <div
        v-if="importPreview.hasSettings"
        class="flex items-center gap-2 text-[11px] text-meta"
      >
        <UIcon name="i-lucide-settings" class="size-3.5" />
        Includes settings.json
      </div>
    </div>

    <!-- Import result -->
    <div
      v-if="importResult"
      class="rounded-xl p-4 space-y-2"
      style="background: var(--surface-raised); border: 1px solid var(--border-default);"
    >
      <div class="flex items-center gap-2 text-[13px] font-medium" style="color: var(--success, #22c55e);">
        <UIcon name="i-lucide-check-circle" class="size-4" />
        Import complete
      </div>
      <div class="grid grid-cols-2 gap-2 text-[12px] text-body">
        <span>Agents: <strong>{{ importResult.imported.agents }}</strong></span>
        <span>Commands: <strong>{{ importResult.imported.commands }}</strong></span>
        <span>Skills: <strong>{{ importResult.imported.skills }}</strong></span>
        <span>Workflows: <strong>{{ importResult.imported.workflows }}</strong></span>
      </div>
      <div v-if="importResult.skipped > 0" class="text-[11px] text-meta">
        {{ importResult.skipped }} file(s) skipped (already exist)
      </div>
      <div v-if="importResult.errors.length > 0" class="space-y-1 mt-2">
        <div class="text-[11px] font-medium" style="color: var(--error);">Errors:</div>
        <div
          v-for="(err, i) in importResult.errors"
          :key="i"
          class="text-[11px] font-mono px-2 py-1 rounded"
          style="background: rgba(239,68,68,0.06); color: var(--error);"
        >
          {{ err }}
        </div>
      </div>
      <button class="text-[11px] text-meta hover:text-label mt-1" @click="resetImport">
        Import another file
      </button>
    </div>

    <!-- Error message -->
    <div
      v-if="importError"
      class="rounded-lg px-3 py-2 text-[12px]"
      style="background: rgba(248,113,113,0.06); color: var(--error); border: 1px solid rgba(248,113,113,0.12);"
    >
      {{ importError }}
    </div>

    <!-- Overwrite toggle -->
    <label v-if="importPreview && !importResult" class="flex items-center gap-3 cursor-pointer">
      <input v-model="overwrite" type="checkbox" class="shrink-0" />
      <div>
        <div class="text-[13px] font-medium">Overwrite existing files</div>
        <div class="text-[11px] text-meta mt-0.5">If off, existing agents/skills/etc. are skipped</div>
      </div>
    </label>

    <!-- Import button -->
    <div v-if="importPreview && !importResult" class="flex justify-end pt-1">
      <UButton
        label="Import"
        icon="i-lucide-upload"
        size="sm"
        :loading="importing"
        :disabled="!importPayload"
        @click="doImport"
      />
    </div>
  </div>
</template>
