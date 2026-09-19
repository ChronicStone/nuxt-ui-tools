<script setup lang="ts">
import { defineComponent } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()

const RenderGridSkeleton = defineComponent({
  name: 'RenderGridSkeleton',
  setup() {
    return () => internals.schema.value.grid?.renderSkeleton?.({ layout: 'grid' }) ?? null
  },
})
</script>

<template>
  <RenderGridSkeleton v-if="internals.schema.value.grid?.renderSkeleton" />

  <div
    v-else
    class="nut-dl-gskel flex flex-col gap-2.5 rounded-[10px] border border-default bg-default px-4 py-3.5"
    aria-hidden="true"
  >
    <div class="flex items-center gap-2.5">
      <span class="nut-dl-skeleton size-7 shrink-0 rounded-md" />
      <span class="grid flex-1 gap-1.5">
        <span class="nut-dl-skeleton block h-3 w-1/2 rounded" />
        <span class="nut-dl-skeleton block h-2.5 w-1/3 rounded" />
      </span>
    </div>
    <div class="grid grid-cols-2 gap-x-3 gap-y-2 pt-1">
      <span v-for="n in 4" :key="n" class="grid gap-1.5">
        <span class="nut-dl-skeleton block h-2.5 w-1/3 rounded" />
        <span class="nut-dl-skeleton block h-3 w-3/4 rounded" />
      </span>
    </div>
    <div class="mt-1 flex items-center gap-2 border-t border-muted pt-2.5">
      <span class="nut-dl-skeleton block h-3 w-16 rounded" />
      <span class="nut-dl-skeleton block h-3 w-20 rounded" />
      <span class="nut-dl-skeleton ml-auto block h-5 w-12 rounded-full" />
    </div>
  </div>
</template>
