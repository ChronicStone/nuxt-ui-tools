<script setup lang="ts">
import { computed } from 'vue'
import type { FunctionalComponent } from 'vue'

import DisplayAlert from '../../../display/components/blocks/display-alert.vue'
import DisplayBlock from '../../../display/components/display.vue'
import DisplayLoadError from '../../../display/components/parts/display-load-error.vue'
import DisplaySkeleton from '../../../display/components/parts/display-skeleton.vue'
import type { DisplayAlertProps } from '../../../display/types'
import { DISPLAY_SKELETON_LAYOUTS } from '../../../display/utils/registry'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import type { FormInfoField } from '../../types'
import { resolveFormDynamic } from '../../utils/dynamic'
import { resolveFormText } from '../../utils/text'
import { useInfoDisplay } from './use-info-display'

const props = defineProps<{
  field: FormInfoField
  path: readonly string[]
}>()

const form = useFormRuntimeContext()
const params = computed(() => form.getFieldCallbackParams(props.path, props.field))
const displayField = computed(() => (props.field.display === undefined ? undefined : props.field))
const display = useInfoDisplay({
  callbackParams: params,
  field: () => displayField.value,
  path: () => props.path,
})

// With a label or supporting copy the field sits in the standard wrapper, like an input.
const shelled = computed(() => {
  const { description, help, hint, label } = props.field
  return [description, help, hint, label].some((value) => value !== undefined)
})
const Bare: FunctionalComponent = (_, { slots }) => slots.default?.()

const notice = computed<DisplayAlertProps | undefined>(() => {
  const field = props.field
  if (field.display !== undefined) return undefined
  const options =
    field.props === undefined ? undefined : resolveFormDynamic(field.props, params.value)
  return {
    appearance: options?.variant ?? 'soft',
    icon: options?.icon === false ? false : (options?.icon ?? 'i-lucide-info'),
    message: resolveFormDynamic(field.content, params.value),
    title: resolveFormText(options?.title),
    tone: options?.color ?? 'neutral',
  }
})
</script>

<template>
  <component :is="shelled ? FormFieldShell : Bare" v-bind="shelled ? { field, path } : {}">
    <template v-if="displayField">
      <DisplaySkeleton
        v-if="display.pending.value"
        :layout="DISPLAY_SKELETON_LAYOUTS[displayField.display]"
        :count="3"
      />
      <DisplayLoadError v-else-if="display.error.value !== null" @retry="display.retry" />
      <DisplayBlock
        v-else-if="display.props.value"
        :display="displayField.display"
        :props="display.props.value"
        :preset="displayField.preset"
      />
    </template>
    <DisplayAlert v-else-if="notice" v-bind="notice" />
  </component>
</template>
