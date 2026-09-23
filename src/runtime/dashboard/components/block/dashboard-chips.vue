<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDashboardUi } from '../../composables/use-dashboard-ui'
import { resolveDashboardClasses } from '../../utils/ui'

/**
 * Removable chips in a block toolbar: the series a filter picks (with their color), or the
 * drill-down filters narrowing the block (with their name).
 */
const { chips } = defineProps<{
  chips: readonly {
    key: string
    label: string
    /** Filter name shown before the value. */
    prefix?: string
    /** CSS color of the series swatch. */
    color?: string
    /** Accessible name of the remove button. */
    removeLabel: string
    remove: () => void
  }[]
}>()

const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(
    {
      chip: 'inline-flex h-7 max-w-full min-w-0 items-center gap-[7px] rounded-full bg-elevated pr-1.5 pl-2.5 text-[12.5px] font-medium text-default',
      label: 'text-muted',
      remove:
        'grid size-[18px] flex-none place-items-center rounded-full text-dimmed transition-colors outline-none hover:bg-accented hover:text-default focus-visible:ring-2 focus-visible:ring-primary',
      swatch: 'size-2 flex-none rounded-[2px]',
    },
    appUi.value.chips,
  ),
)
</script>

<template>
  <span v-for="chip in chips" :key="chip.key" :class="classes.chip" data-dashboard-chip>
    <i
      v-if="chip.color"
      aria-hidden="true"
      :class="classes.swatch"
      :style="{ background: chip.color }"
    />
    <span v-if="chip.prefix" :class="classes.label">{{ chip.prefix }}</span>
    <span class="truncate">{{ chip.label }}</span>
    <button
      type="button"
      :class="classes.remove"
      :aria-label="chip.removeLabel"
      @click="chip.remove()"
    >
      <UIcon name="i-lucide-x" class="size-2.5" />
    </button>
  </span>
</template>
