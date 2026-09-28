<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { useElementHover, useFocusWithin } from '@vueuse/core'
import { computed } from 'vue'

import { useFormUi } from '../../composables/use-form-ui'
import { mergeFormUiClass } from '../../utils/ui'

/**
 * Message of an invalid array-table cell, in a tooltip shown on hover and kept open while the cell
 * has focus. Only invalid cells mount it, so valid cells track no pointer or focus state.
 */
const props = defineProps<{
  control: HTMLElement
  error: string
}>()

const formUi = useFormUi()
const ui = computed(() => formUi.ui.value.arrayTable?.ui)
const control = computed(() => props.control)
const hovered = useElementHover(control)
const { focused } = useFocusWithin(control)
</script>

<template>
  <UTooltip
    :reference="control"
    :open="hovered || focused"
    :content="{ align: 'start', side: 'top', sideOffset: 6 }"
    :ui="{
      content: mergeFormUiClass(
        'h-auto max-w-80 items-start gap-1.5 bg-error px-2.5 py-1.5 text-xs text-inverted ring-error',
        ui?.error,
      ),
      arrow: 'fill-error',
    }"
    arrow
  >
    <template #content>
      <UIcon name="i-lucide-circle-alert" class="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span data-form-cell-error="">{{ error }}</span>
    </template>
  </UTooltip>
</template>
