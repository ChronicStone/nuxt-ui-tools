<script setup lang="ts">
import UFormField from '@nuxt/ui/components/FormField.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { useElementHover, useFocusWithin } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormField } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

/**
 * One editable cell of an array table. An invalid cell highlights its control through the Nuxt UI
 * form field context and shows its message in a tooltip on hover, kept open while the cell has
 * focus, instead of pushing text under the control. Only invalid cells mount a tooltip, so large
 * tables stay cheap to render. The cell positions the visually hidden message, which would
 * otherwise escape the table's scroll containers and stretch the document.
 */
const props = defineProps<{
  field: FormField
  itemPath: readonly string[]
}>()

const form = useFormRuntimeContext()
const formUi = useFormUi()
const ui = computed(() => formUi.ui.value.arrayTable?.ui)
const control = useTemplateRef<HTMLElement>('control')
const hovered = useElementHover(control)
const { focused } = useFocusWithin(control)
const path = computed(() => [...props.itemPath, props.field.key])
const error = computed(() => form.getFieldError(path.value))
</script>

<template>
  <div
    ref="control"
    :class="mergeFormUiClass('relative flex w-full items-center [&>*]:w-full', ui?.control)"
    :data-form-cell-invalid="error ? path.join('.') : undefined"
  >
    <UFormField
      :name="path.join('.')"
      :error="error"
      :ui="{ root: 'w-full', container: 'mt-0', error: 'sr-only' }"
    >
      <FormFieldRenderer :field="field" :parent-path="itemPath" bare />
    </UFormField>
  </div>
  <UTooltip
    v-if="error"
    :reference="control ?? undefined"
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
