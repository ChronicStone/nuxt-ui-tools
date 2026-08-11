import { computed, watch } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { FormField, FormObject, FormValidationTrigger } from '../types'
import { createFormFieldInstance } from '../utils/field-instance'
import { resolveFormText } from '../utils/text'
import { useFieldOptions } from './use-field-options'
import { useFormRuntimeContext } from './use-form-runtime'

export function useFieldControl(field: () => FormField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const { t } = useUiToolsLocale()
  const api = computed(() => form.getFieldApi(path(), field()))
  const params = computed(() => form.getFieldCallbackParams(path(), field()))
  const options = useFieldOptions({
    field,
    path,
    api,
    callbackParams: params,
    register: form.registerFieldOptions,
    refreshFieldOptions: form.refreshFieldOptions,
  })

  const controlProps = computed<FormObject>(() => {
    const current = field()
    if (!('props' in current)) return {}
    const value = Object.getOwnPropertyDescriptor(current, 'props')?.value
    if (typeof value === 'function') {
      const result = value(params.value)
      return typeof result === 'object' && result !== null && !Array.isArray(result) ? result : {}
    }
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
  })

  const disabled = computed(() => {
    const current = field()
    const value = Object.getOwnPropertyDescriptor(current, 'disabled')?.value
    const disabledByCallback = typeof value === 'function' ? value(params.value) === true : false
    return disabledByCallback || (options.disableOnLoading.value && options.loading.value)
  })

  const placeholder = computed(() => {
    const current = field()
    const value = Object.getOwnPropertyDescriptor(current, 'placeholder')?.value
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'function') {
      return resolveFormText(value) ?? t('form.fields.text.defaultPlaceholder')
    }

    return t('form.fields.text.defaultPlaceholder')
  })

  watch(
    () => form.getValue(path()),
    async () => {
      if (!createFormFieldInstance(field()).capability.has('validation')) return
      const trigger = getValidationTrigger(field())
      if (trigger === 'submit') return
      if (trigger === 'blur' && !form.isFieldTouched(path())) return

      if (trigger === 'input') form.markFieldTouched(path())
      await api.value.validation.validate()
    },
    { deep: true },
  )

  async function handleBlur() {
    if (!createFormFieldInstance(field()).capability.has('validation')) return
    if (getValidationTrigger(field()) === 'submit') return

    form.markFieldTouched(path())
    await api.value.validation.validate()
  }

  return {
    form,
    api,
    params,
    controlProps,
    disabled,
    handleBlur,
    options,
    placeholder,
  }
}

function getValidationTrigger(field: FormField): FormValidationTrigger {
  if (!createFormFieldInstance(field).capability.has('validation')) return 'blur'
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (typeof validation !== 'object' || validation === null || Array.isArray(validation))
    return 'blur'

  const trigger = Object.getOwnPropertyDescriptor(validation, 'trigger')?.value
  return trigger === 'input' || trigger === 'submit' ? trigger : 'blur'
}
