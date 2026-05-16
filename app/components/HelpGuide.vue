<script setup lang="ts">
const { isOpen, currentHelp } = useHelpTooltips()
</script>

<template>
  <!-- Only render panel when open -->
  <template v-if="currentHelp">
    <!-- Slide-in help panel -->
    <Teleport to="body">
      <div
        class="help-guide-overlay"
        :class="{ 'help-guide-overlay--open': isOpen }"
        @click.self="isOpen = false"
      />
      <aside
        class="help-guide-panel"
        :class="{ 'help-guide-panel--open': isOpen }"
        role="dialog"
        aria-modal="true"
        :aria-label="`Hướng dẫn: ${currentHelp.title}`"
      >
        <!-- Panel header -->
        <div class="help-guide-header">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-help-circle" class="size-4 shrink-0" style="color: var(--accent);" />
            <h2 class="text-[14px] font-semibold" style="color: var(--text-primary); font-family: var(--font-display);">
              {{ currentHelp.title }}
            </h2>
          </div>
          <button
            class="size-7 flex items-center justify-center rounded-lg transition-colors duration-150 focus-ring"
            style="color: var(--text-tertiary);"
            aria-label="Đóng"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
            @click="isOpen = false"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </div>

        <!-- Panel body -->
        <div class="help-guide-body">
          <!-- Description -->
          <p class="text-[13px] leading-relaxed" style="color: var(--text-secondary);">
            {{ currentHelp.description }}
          </p>

          <!-- Steps -->
          <div class="help-section">
            <h3 class="help-section-title">
              <UIcon name="i-lucide-list-ordered" class="size-3.5 shrink-0" style="color: var(--accent);" />
              Cách dùng:
            </h3>
            <ol class="space-y-2">
              <li
                v-for="(step, idx) in currentHelp.steps"
                :key="idx"
                class="flex items-start gap-2.5"
              >
                <span
                  class="help-step-number"
                >
                  {{ idx + 1 }}
                </span>
                <span class="text-[12px] leading-relaxed pt-px" style="color: var(--text-secondary);">
                  {{ step }}
                </span>
              </li>
            </ol>
          </div>

          <!-- Tips -->
          <div v-if="currentHelp.tips.length" class="help-section">
            <h3 class="help-section-title">
              <UIcon name="i-lucide-lightbulb" class="size-3.5 shrink-0" style="color: #f59e0b;" />
              Mẹo:
            </h3>
            <ul class="space-y-2">
              <li
                v-for="(tip, idx) in currentHelp.tips"
                :key="idx"
                class="flex items-start gap-2"
              >
                <UIcon
                  name="i-lucide-lightbulb"
                  class="size-3 shrink-0 mt-1"
                  style="color: #f59e0b;"
                />
                <span class="text-[12px] leading-relaxed" style="color: var(--text-secondary);">
                  {{ tip }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </Teleport>
  </template>
</template>

<style>

/* Backdrop overlay */
.help-guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgba(0, 0, 0, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.help-guide-overlay--open {
  opacity: 1;
  pointer-events: auto;
}

/* Slide-in panel */
.help-guide-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  width: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  background: var(--surface-raised, var(--surface-overlay));
  border-left: 1px solid var(--border-subtle);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
}

.help-guide-panel--open {
  transform: translateX(0);
}

/* Panel header */
.help-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

/* Panel scrollable body */
.help-guide-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Section block */
.help-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.help-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-sans);
}

/* Step number badge */
.help-step-number {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  background: var(--accent-muted);
  color: var(--accent);
  border: 1px solid var(--accent-glow);
  margin-top: 2px;
}
</style>
