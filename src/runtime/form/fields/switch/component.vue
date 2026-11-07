<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import USwitch from '@nuxt/ui/components/Switch.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormFieldBare } from '../../composables/use-form-field-chrome'
import type { FormControlUi, FormSwitchField } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormSwitchField
  path: readonly string[]
}>()
const bare = useFormFieldBare()

const { fieldProps, form, controlProps, disabled, handleBlur, validationPending } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: ['trueValue', 'falseValue', 'icon'] },
)
/**
 * With an `icon`, the label wrapper becomes a two-column grid: the icon spans the label and the
 * description, which line up in the second column. The label element steps out of the layout so
 * the icon and the label text it holds become grid items.
 */
const ICON_UI = {
  description: 'col-start-2',
  label: 'contents',
  wrapper: 'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3',
} as const
const icon = computed(() => (bare.value ? undefined : fieldProps.value.icon))
const ui = computed<FormControlUi | undefined>(() => {
  const current = controlProps.value.ui
  if (!icon.value) return current
  return {
    ...current,
    description: mergeFormUiClass(ICON_UI.description, current?.description),
    label: mergeFormUiClass(ICON_UI.label, current?.label),
    wrapper: mergeFormUiClass(ICON_UI.wrapper, current?.wrapper),
  }
})
const model = computed<boolean>({
  get: () => {
    const value = form.getValue(props.path)
    return value === (fieldProps.value.trueValue ?? true)
  },
  set: (value) =>
    form.setValue(
      props.path,
      value ? (fieldProps.value.trueValue ?? true) : (fieldProps.value.falseValue ?? false),
    ),
})
</script>

<template>
  <FormFieldShell
    v-slot="{ label, description, required }"
    :field="field"
    :path="path"
    inline-label
  >
    <USwitch
      v-model="model"
      v-bind="controlProps"
      :label="bare ? undefined : label"
      :description="bare ? undefined : description"
      :required="required"
      :disabled="disabled"
      :checked-icon="fieldProps.checkedIcon"
      :unchecked-icon="fieldProps.uncheckedIcon"
      :loading="validationPending || fieldProps.loading"
      :ui="ui"
      @change="handleBlur"
    >
      <template v-if="icon" #label>
        <UIcon
          :name="icon"
          :class="mergeFormUiClass('row-span-2 size-5 text-muted', ui?.leadingIcon)"
          aria-hidden="true"
          data-switch-icon
        />
        <span class="col-start-2 block">{{ label }}</span>
      </template>
    </USwitch>
  </FormFieldShell>
</template>
