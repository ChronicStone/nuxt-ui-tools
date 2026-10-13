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
 *
 * A `compact` card lays itself out as one row inside the grid its label becomes: the icon (or a
 * smaller tile) beside the title, over a one-line description. Both lines truncate and keep the
 * full text in their tooltip, and the marks center on the row. The card passes the description
 * here because the Nuxt UI group would draw it below the icon instead.
 */
defineProps<{
  label?: string
  description?: string
  icon?: string
  value?: string | number | boolean
  tile: boolean
  compact?: boolean
  mark: ChoiceCardMark
  selected: boolean
  ui?: FormControlUi
}>()

/** Where the corner check and the switch sit on a compact card: centered on its row. */
const COMPACT_MARK = 'end-2.5 top-1/2 -translate-y-1/2'
/** The compact tile: smaller, and the first column of the label grid. */
const COMPACT_TILE = 'col-start-1 row-span-2 me-2.5 size-7 rounded-md'
</script>

<template>
  <span
    v-if="tile && icon"
    :data-selected="selected || undefined"
    :data-value="value"
    :class="
      mergeFormUiClass(
        'grid size-8 place-items-center rounded-lg bg-elevated text-muted transition-colors data-[selected]:bg-primary/10 data-[selected]:text-primary',
        compact ? COMPACT_TILE : undefined,
        ui?.tile,
      )
    "
    data-choice-tile
  >
    <UIcon :name="icon" :class="mergeFormUiClass('size-4', ui?.tileIcon)" aria-hidden="true" />
  </span>
  <template v-if="compact">
    <UIcon
      v-if="icon && !tile"
      :name="icon"
      :class="
        mergeFormUiClass('col-start-1 row-span-2 me-2.5 size-4 shrink-0 text-muted', ui?.optionIcon)
      "
      aria-hidden="true"
    />
    <span :title="label" class="col-start-2 block truncate" data-choice-title>{{ label }}</span>
    <span
      v-if="description"
      :title="description"
      class="col-start-2 block truncate text-xs font-normal text-muted"
      data-choice-description
    >
      {{ description }}
    </span>
  </template>
  <span v-else-if="!tile && icon" class="inline-flex items-center gap-2">
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
        compact ? COMPACT_MARK : undefined,
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
        compact ? COMPACT_MARK : undefined,
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
