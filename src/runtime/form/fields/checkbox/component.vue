<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormFieldBare } from '../../composables/use-form-field-chrome'
import type { FormCheckboxField } from '../../types'

const props = defineProps<{
  field: FormCheckboxField
  path: readonly string[]
}>()
const bare = useFormFieldBare()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<boolean>({
  get: () => form.getValue(props.path) === true,
  set: (value) => form.setValue(props.path, value),
})
</script>

<template>
  <FormFieldShell
    v-slot="{ label, description, required }"
    :field="field"
    :path="path"
    inline-label
  >
    <UCheckbox
      v-model="model"
      v-bind="controlProps"
      :label="bare ? undefined : label"
      :description="bare ? undefined : description"
      :required="required"
      :disabled="disabled"
      class="w-full"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
