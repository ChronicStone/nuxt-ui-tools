<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { vMaska } from 'maska/vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue, FormTextField } from '../../types'
import { applyTextMask, maskDirectiveOptions, stripTextMask } from '../../utils/mask'
import { isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormTextField
  path: readonly string[]
  bare?: boolean
}>()

const { t } = useUiToolsLocale()
const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<string | undefined>({
  get: () => displayValue(form.getValue(props.path)),
  set: (value) => form.setValue(props.path, normalize(value)),
})
const maskOptions = computed(() => maskDirectiveOptions(props.field.mask))
const prefix = computed(() => resolveFormText(props.field.prefix))
const suffix = computed(() => resolveFormText(props.field.suffix))
const showClear = computed(
  () => props.field.clearable === true && !disabled.value && Boolean(model.value),
)
const hasLeading = computed(() => Boolean(prefix.value) || Boolean(props.field.icon))
const hasTrailing = computed(
  () => Boolean(suffix.value) || Boolean(props.field.trailingIcon) || showClear.value,
)
const controlClass = computed(() =>
  mergeFormUiClass(
    mergeFormUiClass('w-full', props.field.mono ? 'font-mono tabular-nums' : undefined),
    controlProps.value.class,
  ),
)

function displayValue(value: FormValue) {
  if (!isString(value)) {
    return
  }
  return props.field.mask ? applyTextMask(value, props.field.mask) : value
}

function normalize(value: string | undefined) {
  if (value === undefined || value === '') {
    return null
  }
  if (!props.field.mask) {
    return value
  }
  const masked = applyTextMask(value, props.field.mask)
  return props.field.maskOutput === 'raw' ? stripTextMask(masked, props.field.mask) : masked
}

function clear() {
  form.setValue(props.path, null)
}
</script>

<template>
  <UInput
    v-if="bare"
    v-model="model"
    v-maska="maskOptions"
    v-bind="controlProps"
    :class="controlClass"
    :type="field.inputType ?? 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="field.maxlength"
    :icon="field.icon"
    :trailing-icon="field.trailingIcon"
    :leading="hasLeading"
    :trailing="hasTrailing"
    @blur="handleBlur"
  >
    <template v-if="prefix" #leading>
      <span class="text-sm text-muted" data-form-prefix="">{{ prefix }}</span>
    </template>
    <template v-if="hasTrailing" #trailing>
      <span v-if="suffix" class="text-sm text-muted" data-form-suffix="">{{ suffix }}</span>
      <UButton
        v-if="showClear"
        icon="i-lucide-x"
        color="neutral"
        variant="link"
        size="xs"
        class="p-0"
        :aria-label="t('form.fields.text.clear')"
        data-form-clear=""
        @click="clear"
      />
    </template>
  </UInput>
  <FormFieldShell v-else :field="field" :path="path">
    <UInput
      v-model="model"
      v-maska="maskOptions"
      v-bind="controlProps"
      :class="controlClass"
      :type="field.inputType ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="field.maxlength"
      :icon="field.icon"
      :trailing-icon="field.trailingIcon"
      :leading="hasLeading"
      :trailing="hasTrailing"
      @blur="handleBlur"
    >
      <template v-if="prefix" #leading>
        <span class="text-sm text-muted" data-form-prefix="">{{ prefix }}</span>
      </template>
      <template v-if="hasTrailing" #trailing>
        <span v-if="suffix" class="text-sm text-muted" data-form-suffix="">{{ suffix }}</span>
        <UButton
          v-if="showClear"
          icon="i-lucide-x"
          color="neutral"
          variant="link"
          size="xs"
          class="p-0"
          :aria-label="t('form.fields.text.clear')"
          data-form-clear=""
          @click="clear"
        />
      </template>
    </UInput>
  </FormFieldShell>
</template>
