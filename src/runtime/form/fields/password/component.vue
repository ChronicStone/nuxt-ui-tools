<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormPasswordField } from '../../types'
import { isObject, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormPasswordField
  path: readonly string[]
  bare?: boolean
}>()

const { t } = useUiToolsLocale()
const { form, controlProps, controlSize, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
type PasswordVisibilityConfig = Exclude<NonNullable<FormPasswordField['visibilityToggle']>, boolean>

const visible = ref(false)
const visibilityToggleEnabled = computed(() => props.field.visibilityToggle !== false)
const visibilityToggleConfig = computed(() =>
  isPasswordVisibilityConfig(props.field.visibilityToggle)
    ? props.field.visibilityToggle
    : undefined,
)
const inputType = computed(() => (visible.value ? 'text' : 'password'))
const visibilityLabel = computed(() => {
  const configured = visible.value
    ? visibilityToggleConfig.value?.hideLabel
    : visibilityToggleConfig.value?.showLabel
  return (
    resolveFormText(configured) ??
    t(visible.value ? 'form.fields.password.hide' : 'form.fields.password.show')
  )
})
const visibilityIcon = computed(() =>
  visible.value
    ? (visibilityToggleConfig.value?.hideIcon ?? 'i-lucide-eye-off')
    : (visibilityToggleConfig.value?.showIcon ?? 'i-lucide-eye'),
)
function isPasswordVisibilityConfig(
  value: FormPasswordField['visibilityToggle'],
): value is PasswordVisibilityConfig {
  return isObject(value)
}

const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <UInput
    v-if="bare"
    v-model="model"
    v-bind="controlProps"
    class="w-full"
    :type="inputType"
    :placeholder="placeholder"
    :disabled="disabled"
    @blur="handleBlur"
  >
    <template v-if="visibilityToggleEnabled" #trailing>
      <UButton
        type="button"
        color="neutral"
        variant="link"
        :size="controlSize"
        :icon="visibilityIcon"
        :aria-label="visibilityLabel"
        :title="visibilityLabel"
        :aria-pressed="visible"
        :disabled="disabled"
        :ui="{ base: 'p-0' }"
        @mousedown.prevent
        @click="visible = !visible"
      />
    </template>
  </UInput>
  <FormFieldShell v-else :field="field" :path="path">
    <UInput
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :type="inputType"
      :placeholder="placeholder"
      :disabled="disabled"
      @blur="handleBlur"
    >
      <template v-if="visibilityToggleEnabled" #trailing>
        <UButton
          type="button"
          color="neutral"
          variant="link"
          :size="controlSize"
          :icon="visibilityIcon"
          :aria-label="visibilityLabel"
          :title="visibilityLabel"
          :aria-pressed="visible"
          :disabled="disabled"
          :ui="{ base: 'p-0' }"
          @mousedown.prevent
          @click="visible = !visible"
        />
      </template>
    </UInput>
  </FormFieldShell>
</template>
