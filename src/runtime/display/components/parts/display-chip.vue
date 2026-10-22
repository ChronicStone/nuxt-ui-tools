<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import { computed } from 'vue'

import type { DisplayChip, DisplayContent, DisplayText } from '../../types'
import { resolveDisplayText } from '../../utils/content'
import { displayToneClass, isBuiltinTone } from '../../utils/tone'
import DisplayRender from './display-render'

const { chip, content = undefined } = defineProps<{
  chip: Omit<DisplayChip, 'label'> & { label?: DisplayText }
  /** Rich content drawn instead of the label. */
  content?: DisplayContent
}>()

// A registered tone is not a Nuxt UI color: the badge stays neutral and reads the tone variables.
const SOFT = 'bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)] ring-0'
const VARIANT_CLASSES = [
  [
    'outline',
    'bg-transparent text-[var(--nut-tone-ink)] ring ring-inset ring-[var(--nut-tone-line)]',
  ],
  ['solid', 'bg-[var(--nut-tone)] text-[var(--nut-tone-contrast)] ring-0'],
  [
    'subtle',
    'bg-[var(--nut-tone-soft)] text-[var(--nut-tone-ink)] ring ring-inset ring-[var(--nut-tone-line)]',
  ],
] as const

const badge = computed(() => {
  const { label, tone, ...rest } = chip
  const variant = rest.variant ?? 'soft'
  const custom = tone !== undefined && !isBuiltinTone(tone)
  return {
    ...rest,
    class: custom ? [displayToneClass(tone), variantClass(variant), rest.class] : rest.class,
    color: custom ? 'neutral' : (rest.color ?? tone ?? 'neutral'),
    label: content === undefined ? resolveDisplayText(label) : undefined,
    size: rest.size ?? 'sm',
    variant,
  }
})

function variantClass(variant: PropertyKey) {
  return VARIANT_CLASSES.find(([name]) => name === variant)?.[1] ?? SOFT
}
</script>

<template>
  <UBadge v-bind="badge" :data-tone="chip.tone">
    <DisplayRender v-if="content !== undefined" :content="content" />
  </UBadge>
</template>
