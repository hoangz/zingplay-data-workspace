<script setup lang="ts">
// Floating bulk action bar shown at bottom when items are selected
const props = defineProps<{
  selectedCount: number
  totalCount: number
  itemLabel: string // "agent" | "skill" | "command"
}>()

const emit = defineEmits<{
  deleteSelected: []
  clearSelection: []
  selectAll: []
}>()

function handleDelete() {
  if (!confirm(`Delete ${props.selectedCount} ${props.itemLabel}${props.selectedCount === 1 ? '' : 's'}? This cannot be undone.`)) return
  emit('deleteSelected')
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="selectedCount > 0"
      class="bulk-action-bar"
    >
      <!-- Selection count -->
      <span class="text-[12px] font-medium shrink-0" style="color: var(--text-primary);">
        {{ selectedCount }} {{ itemLabel }}{{ selectedCount === 1 ? '' : 's' }} selected
      </span>

      <div class="w-px h-4 shrink-0" style="background: var(--border-emphasis);" />

      <!-- Select all button -->
      <button
        class="bulk-btn"
        :disabled="selectedCount === totalCount"
        @click="emit('selectAll')"
      >
        Select All ({{ totalCount }})
      </button>

      <!-- Clear button -->
      <button
        class="bulk-btn"
        @click="emit('clearSelection')"
      >
        Clear
      </button>

      <div class="w-px h-4 shrink-0" style="background: var(--border-emphasis);" />

      <!-- Delete button -->
      <button
        class="bulk-btn bulk-btn--danger"
        @click="handleDelete"
      >
        <UIcon name="i-lucide-trash-2" class="size-3.5" />
        Delete Selected
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.bulk-action-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-overlay);
  border: 1px solid var(--border-emphasis);
  border-radius: 12px;
  padding: 10px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 30, 0.4);
  backdrop-filter: blur(16px);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-raised);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.bulk-btn:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
  border-color: var(--border-emphasis);
}

.bulk-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bulk-btn--danger {
  color: var(--error);
  border-color: rgba(248, 113, 113, 0.2);
  background: rgba(248, 113, 113, 0.06);
}

.bulk-btn--danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.35);
  color: var(--error);
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
</style>
