<script setup lang="ts">
defineProps<{
  title: string
}>()

const { isOpen, currentHelp } = useHelpTooltips()
</script>

<template>
  <div
    class="h-16 flex items-center gap-3 px-6 shrink-0 sticky top-0 z-100"
    style="border-bottom: 1px solid var(--border-subtle); background: var(--surface-base); backdrop-filter: blur(12px);"
  >
    <slot name="leading" />
    <h1 class="text-page-title flex-1 flex items-center gap-2.5">
      {{ title }}
      <slot name="trailing" />
    </h1>
    <div class="flex items-center gap-2">
      <!-- Help guide button — only shown when page has help content -->
      <button
        v-if="currentHelp"
        class="help-btn"
        :title="isOpen ? 'Đóng hướng dẫn' : 'Hướng dẫn sử dụng'"
        @click="isOpen = !isOpen"
      >
        <UIcon :name="isOpen ? 'i-lucide-x' : 'i-lucide-circle-help'" class="size-3.5" />
        <span>Hướng dẫn</span>
      </button>
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.help-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-sans);
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  background: var(--accent-muted);
  border: 1px solid var(--border-default);
  color: var(--accent);
}
.help-btn:hover {
  background: var(--accent-glow);
  border-color: var(--accent);
}
</style>
