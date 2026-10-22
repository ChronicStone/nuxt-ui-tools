<script setup lang="ts" generic="TKind extends DisplayKind">
import { computed } from 'vue'

import { useDisplayConfig } from '../composables/use-display-config'
import type { DisplayKind, DisplayPropsMap } from '../types'
import { applyDisplayPreset } from '../utils/config'
import { DISPLAY_BLOCKS } from '../utils/registry'

/**
 * Draws one display block.
 *
 * @example
 * ```vue
 * <UiDisplay display="facts" :props="{ layout: 'grid', items: [{ label: 'Status', value: 'Active' }] }" />
 * ```
 */
const {
  display,
  props: blockProps,
  preset = undefined,
} = defineProps<{
  display: TKind
  props: DisplayPropsMap[TKind]
  /** Name of a preset in `appConfig.nuxtUiTools.display.presets[display]`; `props` override it. */
  preset?: string
}>()

const config = useDisplayConfig()
const resolved = computed(() => applyDisplayPreset(display, blockProps, preset, config.value))
</script>

<template>
  <component :is="DISPLAY_BLOCKS[display]" v-bind="resolved" />
</template>
