<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()
defineProps<{
  height: string
}>()
const rowCount = computed(() => internals.queryContent.data.value.rowCount)
</script>

<template>
  <div
    class="grid place-items-center border border-dashed border-default/60 bg-muted/20 p-8 text-center text-muted"
    :style="{ height }"
  >
    <div class="grid max-w-sm gap-3">
      <div
        class="mx-auto flex size-12 items-center justify-center rounded-xl border border-default/60 bg-default"
      >
        <UIcon name="i-lucide-layout-grid" class="size-5 text-primary" />
      </div>
      <div class="text-base font-medium text-default">
        Grid renderer is queued for the next slice
      </div>
      <p class="text-sm leading-6 text-muted">
        The shared DataList shell is already wired for both layouts. Table mode is live, and grid
        mode is intentionally left as a placeholder for the next iteration.
      </p>
      <div class="text-xs uppercase tracking-[0.22em] text-muted">{{ rowCount }} rows ready</div>
    </div>
  </div>
</template>
