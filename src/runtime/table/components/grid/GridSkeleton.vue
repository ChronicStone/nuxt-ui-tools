<script setup lang="ts">
import UCard from '@nuxt/ui/components/Card.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
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

  <UCard
    v-else
    class="relative overflow-hidden border border-default/70 bg-gradient-to-br from-default via-default to-elevated/70 p-4 shadow-sm ring-1 ring-inset ring-white/5"
  >
    <div class="grid gap-4">
      <div class="flex items-start justify-between gap-3">
        <div class="grid flex-1 gap-2">
          <USkeleton class="h-5 w-2/5 rounded-full" />
          <USkeleton class="h-4 w-4/5 rounded-full" />
        </div>
        <USkeleton class="size-9 rounded-2xl" />
      </div>

      <USkeleton class="h-32 w-full rounded-[20px]" />

      <div class="grid gap-2">
        <USkeleton class="h-4 w-full rounded-full" />
        <USkeleton class="h-4 w-11/12 rounded-full" />
        <USkeleton class="h-4 w-2/3 rounded-full" />
      </div>

      <div class="flex flex-wrap gap-2 pt-1">
        <USkeleton class="h-7 w-20 rounded-full" />
        <USkeleton class="h-7 w-16 rounded-full" />
        <USkeleton class="h-7 w-24 rounded-full" />
      </div>
    </div>
  </UCard>
</template>
