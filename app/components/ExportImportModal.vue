<script setup lang="ts">
// Main modal for Export/Import config feature.
// Delegates tab content to ExportImport/ExportTab.vue and ExportImport/ImportTab.vue.

const props = defineProps<{
  modelValue: boolean
  initialTab?: 'export' | 'import'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const activeTab = ref<'export' | 'import'>(props.initialTab || 'export')
const exportTabRef = ref<{ fetchExportPreview: () => void } | null>(null)

watch(() => props.initialTab, (val) => {
  if (val) activeTab.value = val
})

// Load export preview when switching to export tab
watch(activeTab, (tab) => {
  if (tab === 'export') {
    nextTick(() => exportTabRef.value?.fetchExportPreview())
  }
})

// Load preview when modal first opens on export tab
watch(
  () => props.modelValue,
  (open) => {
    if (open && activeTab.value === 'export') {
      nextTick(() => exportTabRef.value?.fetchExportPreview())
    }
  },
)

const tabs = [
  { id: 'export' as const, label: 'Export', icon: 'i-lucide-download' },
  { id: 'import' as const, label: 'Import', icon: 'i-lucide-upload' },
]

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <UModal :open="modelValue" @update:open="emit('update:modelValue', $event)">
    <template #content>
      <div class="bg-overlay" style="min-width: 480px; max-width: 560px;">
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 pt-5 pb-4"
          style="border-bottom: 1px solid var(--border-subtle);"
        >
          <h3 class="text-page-title">Data Management</h3>
          <button
            class="p-1.5 rounded focus-ring text-meta hover:text-body transition-colors"
            aria-label="Close"
            @click="close"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex px-6 pt-4 gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            :style="activeTab === tab.id
              ? 'background: var(--accent); color: #fff;'
              : 'background: transparent; color: var(--text-secondary);'"
            @click="activeTab = tab.id"
          >
            <UIcon :name="tab.icon" class="size-3.5" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab content -->
        <div class="px-6 py-5">
          <ExportImportExportTab
            v-if="activeTab === 'export'"
            ref="exportTabRef"
            @exported="close"
          />
          <ExportImportImportTab
            v-else-if="activeTab === 'import'"
            @imported="close"
          />
        </div>

        <!-- Footer -->
        <div
          class="flex justify-end px-6 pb-5"
          style="border-top: 1px solid var(--border-subtle);"
        >
          <UButton label="Close" variant="ghost" color="neutral" size="sm" class="mt-4" @click="close" />
        </div>
      </div>
    </template>
  </UModal>
</template>
