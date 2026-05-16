<script setup lang="ts">
useHead({ title: 'ZingPlay Data Workspace' })

onMounted(() => {
  navigateTo('/data', { replace: true })
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div class="text-center">
      <Icon name="i-lucide-bar-chart-3" class="w-12 h-12 mx-auto text-blue-500 animate-pulse" />
      <p class="text-sm text-gray-500 mt-3">Loading workspace...</p>
    </div>
  </div>
</template>
