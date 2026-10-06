<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import type { FormControlUi } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'
import type { ChoiceCardMark } from './types'

/**
 * Content of a card's label: the option icon, inline or in a tile above the label, and the
 * selection mark the card draws itself: a check in the corner of a selected card, or a switch
 * that follows the selection. Both marks are decorative; the group's own control keeps the
 * semantics. Styled through `ui.tile`, `ui.tileIcon`, `ui.optionIcon`, `ui.check`,
 * `ui.checkIcon`, `ui.switch`, and `ui.switchThumb`; the tile and the switch carry the option
 * value as `data-value` for per-option styling.
 */
defineProps<{
  label?: string
  icon?: string
  value?: string | number | boolean
  tile: boolean
  mark: ChoiceCardMark
  selected: boolean
  ui?: FormControlUi
}>()
</script>

<template>
  <span
    v-if="tile && icon"
    :data-selected="selected || undefined"
    :data-value="value"
    :class="
      mergeFormUiClass(
        'grid size-8 place-items-center rounded-lg bg-elevated text-muted transition-colors data-[selected]:bg-primary/10 data-[selected]:text-primary',
        ui?.tile,
      )
    "
    data-choice-tile
  >
    <UIcon :name="icon" :class="mergeFormUiClass('size-4', ui?.tileIcon)" aria-hidden="true" />
  </span>
  <span v-if="!tile && icon" class="inline-flex items-center gap-2">
    <UIcon
      :name="icon"
      :class="mergeFormUiClass('size-4 shrink-0', ui?.optionIcon)"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
  </span>
  <span v-else class="block">{{ label }}</span>
  <span
    v-if="mark === 'corner' && selected"
    aria-hidden="true"
    :class="
      mergeFormUiClass(
        'absolute end-3 top-3 grid size-4 place-items-center rounded-[4px] bg-primary text-inverted',
        ui?.check,
      )
    "
    data-choice-check
  >
    <UIcon name="i-lucide-check" :class="mergeFormUiClass('size-2.5', ui?.checkIcon)" />
  </span>
  <span
    v-if="mark === 'switch'"
    aria-hidden="true"
    :data-state="selected ? 'checked' : 'unchecked'"
    :data-value="value"
    :class="
      mergeFormUiClass(
        'group/switch absolute end-3 top-3.5 inline-flex h-[18px] w-8 shrink-0 items-center rounded-full bg-accented p-0.5 transition-colors duration-150 data-[state=checked]:bg-primary',
        ui?.switch,
      )
    "
    data-choice-switch
  >
    <span
      :class="
        mergeFormUiClass(
          'size-3.5 rounded-full bg-default shadow-xs transition-transform duration-150 group-data-[state=checked]/switch:translate-x-3.5 motion-reduce:transition-none rtl:group-data-[state=checked]/switch:-translate-x-3.5',
          ui?.switchThumb,
        )
      "
    />
  </span>
</template>
