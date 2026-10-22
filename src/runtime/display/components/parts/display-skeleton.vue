<script setup lang="ts">
const { layout = 'lines', count = 3 } = defineProps<{
  layout?: 'lines' | 'rows' | 'tiles' | 'card' | 'media' | 'ring' | 'block'
  count?: number
}>()
</script>

<template>
  <div class="nut-dash-shimmer" aria-busy="true" data-display-skeleton>
    <div v-if="layout === 'rows'" class="flex flex-col">
      <div
        v-for="index in count"
        :key="index"
        class="flex items-center justify-between gap-6 border-t border-muted py-3 first:border-t-0"
      >
        <span
          class="nut-dash-ghost h-3 rounded"
          :style="{ width: `${28 + ((index * 13) % 18)}%` }"
        />
        <span
          class="nut-dash-ghost h-3 rounded"
          :style="{ width: `${16 + ((index * 7) % 12)}%` }"
        />
      </div>
    </div>
    <div
      v-else-if="layout === 'tiles'"
      class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2"
    >
      <div
        v-for="index in count"
        :key="index"
        class="nut-dash-ghost h-16 rounded-[var(--nut-display-radius)]"
      />
    </div>
    <div v-else-if="layout === 'card'" class="flex items-center gap-3">
      <span class="nut-dash-ghost size-12 shrink-0 rounded-[var(--nut-display-radius)]" />
      <div class="flex flex-1 flex-col gap-2">
        <span class="nut-dash-ghost h-3 w-2/5 rounded" />
        <span class="nut-dash-ghost h-3 w-3/5 rounded" />
      </div>
    </div>
    <div
      v-else-if="layout === 'media'"
      class="nut-dash-ghost aspect-video rounded-[var(--nut-display-radius)]"
    />
    <div v-else-if="layout === 'ring'" class="flex items-center gap-4">
      <span class="nut-dash-ghost size-20 shrink-0 rounded-full" />
      <div class="flex flex-1 flex-col gap-2">
        <span class="nut-dash-ghost h-3 w-3/5 rounded" />
        <span class="nut-dash-ghost h-3 w-2/5 rounded" />
      </div>
    </div>
    <div
      v-else-if="layout === 'block'"
      class="nut-dash-ghost h-24 rounded-[var(--nut-display-radius)]"
    />
    <div v-else class="flex flex-col gap-2">
      <span
        v-for="index in count"
        :key="index"
        class="nut-dash-ghost h-3 rounded"
        :style="{ width: index === count && count > 1 ? '55%' : `${92 - ((index * 9) % 20)}%` }"
      />
    </div>
  </div>
</template>
