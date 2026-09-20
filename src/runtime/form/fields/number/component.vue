<script setup lang="ts">
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormNumberField } from '../../types'
import { isNumber } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormNumberField
  path: readonly string[]
  bare?: boolean
}>()

const { code } = useUiToolsLocale()
const { fieldProps, form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: ['prefix', 'suffix', 'format', 'controls', 'mono'] },
)
const model = computed<number | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isNumber(value) ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
})
const prefix = computed(() => resolveFormText(fieldProps.value.prefix))
const suffix = computed(() => resolveFormText(fieldProps.value.suffix))
const controls = computed(() => fieldProps.value.controls !== false)
const hasAffix = computed(() => Boolean(prefix.value) || Boolean(suffix.value))
const inlineAffix = computed(() => hasAffix.value && !controls.value)
const controlUi = computed(() => ({
  ...controlProps.value.ui,
  base: mergeFormUiClass(
    mergeFormUiClass(
      controlProps.value.ui?.base,
      fieldProps.value.mono ? 'font-mono tabular-nums' : undefined,
    ),
    mergeFormUiClass(
      inlineAffix.value && prefix.value ? 'ps-(--nut-form-prefix-width)' : undefined,
      inlineAffix.value && suffix.value ? 'pe-(--nut-form-suffix-width)' : undefined,
    ),
  ),
}))
const affixStyle = computed(() => ({
  '--nut-form-prefix-width': `${Math.max(2.25, (prefix.value?.length ?? 0) * 0.6 + 1.5)}rem`,
  '--nut-form-suffix-width': `${Math.max(2.25, (suffix.value?.length ?? 0) * 0.6 + 1.5)}rem`,
}))
</script>

<template>
  <div
    v-if="bare"
    :class="
      mergeFormUiClass(
        'relative flex w-full items-center',
        hasAffix && !inlineAffix ? 'gap-2' : undefined,
      )
    "
    :style="affixStyle"
  >
    <span
      v-if="prefix"
      :class="
        inlineAffix
          ? 'pointer-events-none absolute inset-y-0 start-3 z-[1] flex items-center text-sm text-muted'
          : 'shrink-0 text-sm text-muted'
      "
      data-form-prefix=""
    >
      {{ prefix }}
    </span>
    <UInputNumber
      v-model="model"
      v-bind="controlProps"
      class="min-w-0 flex-1"
      :ui="controlUi"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="fieldProps.min"
      :max="fieldProps.max"
      :step="fieldProps.step"
      :locale="code"
      :format-options="fieldProps.format"
      :increment="controls"
      :decrement="controls"
      @blur="handleBlur"
    />
    <span
      v-if="suffix"
      :class="
        inlineAffix
          ? 'pointer-events-none absolute inset-y-0 end-3 z-[1] flex items-center text-sm text-muted'
          : 'shrink-0 text-sm text-muted'
      "
      data-form-suffix=""
    >
      {{ suffix }}
    </span>
  </div>
  <FormFieldShell v-else :field="field" :path="path">
    <div
      :class="
        mergeFormUiClass(
          'relative flex w-full items-center',
          hasAffix && !inlineAffix ? 'gap-2' : undefined,
        )
      "
      :style="affixStyle"
    >
      <span
        v-if="prefix"
        :class="
          inlineAffix
            ? 'pointer-events-none absolute inset-y-0 start-3 z-[1] flex items-center text-sm text-muted'
            : 'shrink-0 text-sm text-muted'
        "
        data-form-prefix=""
      >
        {{ prefix }}
      </span>
      <UInputNumber
        v-model="model"
        v-bind="controlProps"
        class="min-w-0 flex-1"
        :ui="controlUi"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="fieldProps.min"
        :max="fieldProps.max"
        :step="fieldProps.step"
        :locale="code"
        :format-options="fieldProps.format"
        :increment="controls"
        :decrement="controls"
        @blur="handleBlur"
      />
      <span
        v-if="suffix"
        :class="
          inlineAffix
            ? 'pointer-events-none absolute inset-y-0 end-3 z-[1] flex items-center text-sm text-muted'
            : 'shrink-0 text-sm text-muted'
        "
        data-form-suffix=""
      >
        {{ suffix }}
      </span>
    </div>
  </FormFieldShell>
</template>
