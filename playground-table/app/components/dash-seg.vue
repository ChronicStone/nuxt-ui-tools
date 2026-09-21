<script setup lang="ts" generic="TValue extends string | number">
const model = defineModel<TValue>({ required: true })
const { format = String } = defineProps<{
  items: readonly TValue[]
  label: string
  /** Button text of a value. Defaults to the value itself. */
  format?: (value: TValue) => string
}>()
</script>

<template>
  <div class="dash-seg" role="radiogroup" :aria-label="label">
    <button
      v-for="item in items"
      :key="item"
      type="button"
      role="radio"
      :aria-checked="model === item"
      :class="{ on: model === item }"
      @click="model = item"
    >
      {{ format(item) }}
    </button>
  </div>
</template>

<style scoped>
.dash-seg {
  display: inline-flex;
  gap: 2px;
  height: 34px;
  padding: 2px;
  border: 1px solid var(--ui-border);
  border-radius: 7px;
  background: var(--ex-page);
}
.dash-seg button {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 4px;
  color: var(--ex-ink-soft);
  font-size: 12.5px;
  font-weight: 500;
  transition:
    background 0.12s,
    color 0.12s;
}
.dash-seg button:hover {
  color: var(--ui-text);
}
.dash-seg button.on {
  background: var(--ex-surface);
  color: var(--ui-text);
  box-shadow: 0 0 0 1px var(--ui-border);
}
.dark .dash-seg button {
  color: var(--ui-text-muted);
}
</style>
