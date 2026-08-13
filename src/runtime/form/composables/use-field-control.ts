import { debounceFilter, throttleFilter, watchWithFilter } from '@vueuse/core'
import { computed, onMounted } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { FormControlSize, FormField, FormObject, FormValidationTrigger } from '../types'
import { createFormFieldInstance } from '../utils/field-instance'
import { resolveFormText } from '../utils/text'
import { mergeFormUiClass } from '../utils/ui'
import { useFieldOptions } from './use-field-options'
import { useFormFieldControlAttrs } from './use-form-field-chrome'
import { useFormRuntimeContext } from './use-form-runtime'
import { useFormUi } from './use-form-ui'

export function useFieldControl(field: () => FormField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const formUi = useFormUi()
  const { t } = useUiToolsLocale()
  const fieldControlAttrs = useFormFieldControlAttrs()
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
    const fieldUi = formUi.ui.value.fields?.[current.type]
    const defaults = {
      ...fieldControlAttrs.value,
      size: fieldUi?.size ?? formUi.controlSize.value,
      class: fieldUi?.class,
      ui: mergeControlUi(formUi.ui.value.control?.ui, fieldUi?.ui),
    }
    if (!('props' in current)) return defaults
    const value = Object.getOwnPropertyDescriptor(current, 'props')?.value
    if (typeof value === 'function') {
      const result = value(params.value)
      const resolved =
        typeof result === 'object' && result !== null && !Array.isArray(result) ? result : {}
      return {
        ...defaults,
        ...resolved,
        class: mergeControlClass(fieldUi?.class, resolved.class),
        ui: mergeControlUi(formUi.ui.value.control?.ui, fieldUi?.ui, resolved.ui),
      }
    }
    const resolved =
      typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
    return {
      ...defaults,
      ...resolved,
      class: mergeControlClass(fieldUi?.class, resolved.class),
      ui: mergeControlUi(formUi.ui.value.control?.ui, fieldUi?.ui, resolved.ui),
    }
  })
  const controlSize = computed<FormControlSize>(() => {
    const value = controlProps.value.size
    return isFormControlSize(value) ? value : formUi.controlSize.value
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

  watchWithFilter(
    () => form.getValue(path()),
    async () => {
      api.value.validation.clearError()
      if (!createFormFieldInstance(field()).capability.has('validation')) return
      const trigger = getValidationTrigger(field())
      if (trigger === 'submit') return
      if (trigger === 'blur' && !form.isFieldTouched(path())) return

      if (trigger === 'input') form.markFieldTouched(path())
      await api.value.validation.validate()
    },
    { deep: true },
  )

  watchWithFilter(
    () => form.getValue(path()),
    (value) => {
      const effect = Object.getOwnPropertyDescriptor(field(), 'watch')?.value
      if (typeof effect === 'function') effect({ value, api: api.value })
    },
    {
      ...resolveWatchOptions(field()),
      eventFilter: resolveEffectFilter(field()),
    },
  )

  watchWithFilter(
    () => params.value.deps,
    () => {
      const effect = Object.getOwnPropertyDescriptor(field(), 'onDependencyChange')?.value
      if (typeof effect === 'function') void effect(params.value)
    },
    { deep: true, eventFilter: resolveEffectFilter(field()) },
  )

  onMounted(() => {
    const effect = Object.getOwnPropertyDescriptor(field(), 'onRendered')?.value
    if (typeof effect === 'function') void effect(params.value)
  })

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
    controlSize,
  }
}

function mergeControlUi(...configs: readonly unknown[]): FormObject {
  return configs.reduce<FormObject>((merged, config) => {
    if (typeof config !== 'object' || config === null || Array.isArray(config)) return merged
    return { ...merged, ...config }
  }, {})
}

function mergeControlClass(defaults: string | undefined, local: unknown) {
  if (typeof local === 'string') return mergeFormUiClass(defaults, local)
  if (typeof local === 'undefined') return defaults
  return [defaults, local]
}

function isFormControlSize(value: unknown): value is FormControlSize {
  return value === 'xs' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl'
}

function resolveWatchOptions(field: FormField) {
  const options = Object.getOwnPropertyDescriptor(field, 'watchOptions')?.value
  if (typeof options !== 'object' || options === null || Array.isArray(options)) return {}
  return {
    deep: options.deep === true,
    immediate: options.immediate === true,
  }
}

function resolveEffectFilter(field: FormField) {
  const effect = Object.getOwnPropertyDescriptor(field, 'stateEffect')?.value
  if (typeof effect !== 'object' || effect === null || Array.isArray(effect)) return undefined
  const duration = typeof effect.duration === 'number' ? effect.duration : 0
  if (effect.type === 'debounce') return debounceFilter(duration)
  if (effect.type === 'throttle') return throttleFilter(duration)
  return undefined
}

function getValidationTrigger(field: FormField): FormValidationTrigger {
  if (!createFormFieldInstance(field).capability.has('validation')) return 'blur'
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (typeof validation !== 'object' || validation === null || Array.isArray(validation))
    return 'blur'

  const trigger = Object.getOwnPropertyDescriptor(validation, 'trigger')?.value
  return trigger === 'input' || trigger === 'submit' ? trigger : 'blur'
}
