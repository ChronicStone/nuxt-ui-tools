<script setup lang="ts">
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { useElementSize } from '@vueuse/core'
import { computed } from 'vue'
import { useTemplateRef } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'

const props = defineProps<{
  minHeight: string
}>()

const internals = useTableInternals()
const rootRef = useTemplateRef<HTMLDivElement>('root')
const { height } = useElementSize(rootRef)
const rowHeight = 48
const topPadding = 24

const skeletonRows = computed(() => {
  const availableHeight = Math.max(height.value - topPadding, 0)
  const count = Math.max(1, Math.ceil(availableHeight / rowHeight))
  return Array.from({ length: count }, (_, index) => index)
})

const skeletonColumns = computed(() => [
  {
    id: '__select',
    width: '3rem',
    align: 'start' as const,
    kind: 'checkbox' as const,
    skeletonWidth: '1rem',
  },
  ...internals.tableColumns.visibleOrderedColumns.value.map((column, index) => ({
    id: column.id,
    width: index === 0 ? '1.3fr' : index === 1 ? '1.15fr' : '0.95fr',
    align: index >= 3 ? ('end' as const) : ('start' as const),
    kind: 'text' as const,
    skeletonWidth:
      index === 0
        ? '10rem'
        : index === 1
          ? '12rem'
          : index === 2
            ? '8rem'
            : index === 3
              ? '9rem'
              : '7rem',
  })),
])

const skeletonGridTemplate = computed(() =>
  skeletonColumns.value.map((column) => column.width).join(' '),
)
</script>

<template>
  <div
    ref="root"
    class="h-full w-full pt-6"
    :style="{ minHeight }"
  >
    <div
      v-for="rowIndex in skeletonRows"
      :key="rowIndex"
      class="grid h-12 items-center gap-3 border-b px-4"
      style="border-bottom-color: color-mix(in oklab, var(--ui-border) 14%, transparent)"
      :style="{ gridTemplateColumns: skeletonGridTemplate }"
    >
      <div
        v-for="column in skeletonColumns"
        :key="`${rowIndex}-${column.id}`"
        class="flex items-center"
        :class="[
          column.align === 'end' ? 'justify-end' : 'justify-start',
          column.kind === 'checkbox' ? 'pl-0' : '',
        ]"
      >
        <template v-if="column.kind === 'checkbox'">
          <USkeleton class="size-4 rounded-md" />
        </template>
        <template v-else>
          <USkeleton class="h-4 rounded-full" :style="{ width: column.skeletonWidth }" />
        </template>
      </div>
    </div>
  </div>
</template>
