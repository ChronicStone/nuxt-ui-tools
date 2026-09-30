<script setup lang="ts">
defineProps<{ title: string; hint?: string }>()
</script>

<template>
  <div class="ex-panel-header">
    <h2>{{ title }}</h2>
    <small v-if="hint">{{ hint }}</small>
    <span class="flex-1" />
    <slot />
  </div>
</template>

<style scoped>
.ex-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 34px;
}
.ex-panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin: 0;
}
.ex-panel-header small {
  color: var(--ui-text-muted);
  font-size: 13px;
}
</style>
