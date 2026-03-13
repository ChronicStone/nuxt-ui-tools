<script setup lang="ts">
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'

const props = defineProps<{
  minHeight: string
}>()

const internals = useTableInternals()

const skeletonRows = computed(() =>
  Array.from({ length: 10 }, (_, index) => index),
)

const skeletonColumns = computed(() => [
  { id: '__select', width: '3rem', align: 'start' as const, kind: 'checkbox' as const, skeletonWidth: '1rem' },
  ...internals.tableColumns.visibleOrderedColumns.value.map((column, index) => ({
    id: column.id,
    width: index === 0 ? '1.3fr' : index === 1 ? '1.15fr' : '0.95fr',
    align: index >= 3 ? 'end' as const : 'start' as const,
    kind: 'text' as const,
    skeletonWidth:
      index === 0 ? '10rem'
      : index === 1 ? '12rem'
      : index === 2 ? '8rem'
      : index === 3 ? '9rem'
      : '7rem',
  })),
])

const skeletonGridTemplate = computed(() =>
  skeletonColumns.value.map((column) => column.width).join(' '),
)
</script>

<template>
  <div class="w-full" :style="{ minHeight }">
    <div
      v-for="rowIndex in skeletonRows"
      :key="rowIndex"
      class="grid h-12 items-center gap-3 border-b px-3"
      style="border-bottom-color: color-mix(in oklab, var(--ui-border) 28%, transparent)"
      :style="{ gridTemplateColumns: skeletonGridTemplate }"
    >
      <div
        v-for="column in skeletonColumns"
        :key="`${rowIndex}-${column.id}`"
        class="flex items-center"
        :class="column.align === 'end' ? 'justify-end' : 'justify-start'"
      >
        <template v-if="column.kind === 'checkbox'">
          <USkeleton class="size-4 rounded-sm" />
        </template>
        <template v-else>
          <USkeleton
            class="h-4 rounded-full"
            :style="{ width: column.skeletonWidth }"
          />
        </template>
      </div>
    </div>
  </div>
</template>
