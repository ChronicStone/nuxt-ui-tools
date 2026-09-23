<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import type { FormControlUi } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

/**
 * Content of a card's label: the option icon, inline or in a tile above the label, and the check
 * a selected card shows in its corner. The tile and the check read `ui.tile` and `ui.check`.
 */
defineProps<{
  label?: string
  icon?: string
  tile: boolean
  corner: boolean
  selected: boolean
  ui?: FormControlUi
}>()
</script>

<template>
  <span
    v-if="tile && icon"
    :data-selected="selected || undefined"
    :class="
      mergeFormUiClass(
        'grid size-8 place-items-center rounded-lg bg-elevated text-muted transition-colors data-[selected]:bg-primary/10 data-[selected]:text-primary',
        ui?.tile,
      )
    "
    data-choice-tile
  >
    <UIcon :name="icon" class="size-4" aria-hidden="true" />
  </span>
  <span v-if="!tile && icon" class="inline-flex items-center gap-2">
    <UIcon :name="icon" class="size-4 shrink-0" aria-hidden="true" />
    <span>{{ label }}</span>
  </span>
  <span v-else class="block">{{ label }}</span>
  <span
    v-if="corner && selected"
    aria-hidden="true"
    :class="
      mergeFormUiClass(
        'absolute end-3 top-3 grid size-4 place-items-center rounded-[4px] bg-primary text-inverted',
        ui?.check,
      )
    "
    data-choice-check
  >
    <UIcon name="i-lucide-check" class="size-2.5" />
  </span>
</template>
