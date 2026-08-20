import { debounceFilter, throttleFilter, watchWithFilter } from '@vueuse/core'
import { computed, onMounted, onScopeDispose } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { FormValue } from '../types'
import type {
  FormControlSize,
  FormControlUi,
  FormField,
  FormObject,
  FormUiClass,
  FormValidationTrigger,
} from '../types'
import { createFormFieldInstance } from '../utils/field-instance'
import { isFunction, isNumber, isObject, isString } from '../utils/predicate'
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
  const validationPending = computed<boolean>(() => api.value.validation.pending())
  const interactionOwner = computed<string>(() => path().join('.'))
  const interactionOwnerClass = computed<string>(
    () => `nut-form-field-owner:${encodeURIComponent(interactionOwner.value)}`,
  )

  type FormControlProps = FormObject & {
    size?: FormControlSize
    class?: FormUiClass
    ui?: FormControlUi
    loading?: boolean
    trailing?: boolean
  }
  const controlProps = computed<FormControlProps>(() => {
    const current = field()
    const fieldUi = formUi.ui.value.fields?.[current.type]
    const bareClass = isString(fieldControlAttrs.value.class)
      ? fieldControlAttrs.value.class
      : undefined
    const defaults = {
      ...fieldControlAttrs.value,
      size: fieldUi?.size ?? formUi.controlSize.value,
      class: mergeFormUiClass(bareClass, fieldUi?.class),
      ui: mergeControlUi(fieldControlAttrs.value.ui, formUi.ui.value.control?.ui, fieldUi?.ui),
    }
    if (!('props' in current)) return defaults
    const value = Object.getOwnPropertyDescriptor(current, 'props')?.value
    if (isFunction(value)) {
      const result = value(params.value)
      const resolved: FormControlProps =
        isObject(result) && result !== null && !Array.isArray(result) ? result : {}
      return {
        ...defaults,
        ...resolved,
        class: mergeControlClass(fieldUi?.class, resolved.class),
        ui: mergeControlUi(formUi.ui.value.control?.ui, fieldUi?.ui, resolved.ui),
      }
    }
    const resolved: FormControlProps =
      isObject(value) && value !== null && !Array.isArray(value) ? value : {}
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
    const disabledByCallback = isFunction(value) ? value(params.value) === true : false
    return disabledByCallback || (options.disableOnLoading.value && options.loading.value)
  })

  const placeholder = computed(() => {
    const current = field()
    const value = Object.getOwnPropertyDescriptor(current, 'placeholder')?.value
    if (isString(value) || isNumber(value) || isFunction(value)) {
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
      if (isFunction(effect)) effect({ value, api: api.value })
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
      if (isFunction(effect)) void effect(params.value)
    },
    { deep: true, eventFilter: resolveEffectFilter(field()) },
  )

  onMounted(() => {
    const effect = Object.getOwnPropertyDescriptor(field(), 'onRendered')?.value
    if (isFunction(effect)) void effect(params.value)
  })

  let blurBoundaryListening = false
  onScopeDispose(stopBlurBoundaryWatch)

  function handleBlur(event?: Event) {
    if (!canBlurValidate()) return

    const relatedTarget = event instanceof FocusEvent ? event.relatedTarget : null
    if (isOwnedOverlayTarget(relatedTarget)) {
      startBlurBoundaryWatch()
      return
    }
    if (isFieldRootTarget(relatedTarget)) return

    setTimeout(() => {
      if (isFieldRootTarget(document.activeElement)) return
      if (isOwnedOverlayTarget(document.activeElement)) {
        startBlurBoundaryWatch()
        return
      }
      if (document.activeElement === document.body && hasOwnedInteractionSurface()) {
        startBlurBoundaryWatch()
        return
      }

      commitBlurValidation()
    })
  }

  function canBlurValidate() {
    if (!createFormFieldInstance(field()).capability.has('validation')) return false
    return getValidationTrigger(field()) !== 'submit'
  }

  function commitBlurValidation() {
    stopBlurBoundaryWatch()
    if (!canBlurValidate()) return

    const trigger = getValidationTrigger(field())
    form.markFieldTouched(path())
    if (trigger === 'input') return
    void api.value.validation.validate()
  }

  function startBlurBoundaryWatch() {
    if (blurBoundaryListening) return
    blurBoundaryListening = true
    document.addEventListener('focusin', handleBoundaryFocusIn, true)
    document.addEventListener('pointerdown', handleBoundaryPointerDown, true)
  }

  function stopBlurBoundaryWatch() {
    if (!blurBoundaryListening) return
    blurBoundaryListening = false
    document.removeEventListener('focusin', handleBoundaryFocusIn, true)
    document.removeEventListener('pointerdown', handleBoundaryPointerDown, true)
  }

  function handleBoundaryFocusIn(event: FocusEvent) {
    if (isFieldRootTarget(event.target)) {
      stopBlurBoundaryWatch()
      return
    }
    if (isOwnedOverlayTarget(event.target)) return
    commitBlurValidation()
  }

  function handleBoundaryPointerDown(event: PointerEvent) {
    if (isFieldRootTarget(event.target) || isOwnedOverlayTarget(event.target)) return
    setTimeout(commitBlurValidation)
  }

  function isFieldRootTarget(target: EventTarget | null) {
    if (!(target instanceof Node)) return false
    const owner = interactionOwner.value
    for (const element of document.querySelectorAll<HTMLElement>('[data-form-field]')) {
      if (element.dataset.formField === owner && element.contains(target)) return true
    }
    return false
  }

  function isOwnedOverlayTarget(target: EventTarget | null) {
    if (!(target instanceof Node)) return false
    for (const element of document.getElementsByClassName(interactionOwnerClass.value)) {
      if (element.contains(target)) return true
    }
    return false
  }

  function hasOwnedInteractionSurface() {
    return document.getElementsByClassName(interactionOwnerClass.value).length > 0
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
    validationPending,
    interactionOwner,
    interactionOwnerClass,
  }
}

function mergeControlUi(...configs: readonly FormValue[]): FormControlUi {
  const merged: FormControlUi = {}
  for (const config of configs) {
    if (!isObject(config) || config === null || Array.isArray(config)) continue
    for (const [slot, value] of Object.entries(config)) if (isString(value)) merged[slot] = value
  }
  return merged
}

function mergeControlClass(defaults: string | undefined, local: FormValue) {
  return isString(local) ? mergeFormUiClass(defaults, local) : defaults
}

function isFormControlSize(value: FormValue): value is FormControlSize {
  return value === 'xs' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl'
}

function resolveWatchOptions(field: FormField) {
  const options = Object.getOwnPropertyDescriptor(field, 'watchOptions')?.value
  if (!isObject(options) || options === null || Array.isArray(options)) return {}
  return {
    deep: options.deep === true,
    immediate: options.immediate === true,
  }
}

function resolveEffectFilter(field: FormField) {
  const effect = Object.getOwnPropertyDescriptor(field, 'stateEffect')?.value
  if (!isObject(effect) || effect === null || Array.isArray(effect)) return undefined
  const duration = isNumber(effect.duration) ? effect.duration : 0
  if (effect.type === 'debounce') return debounceFilter(duration)
  if (effect.type === 'throttle') return throttleFilter(duration)
  return undefined
}

function getValidationTrigger(field: FormField): FormValidationTrigger {
  if (!createFormFieldInstance(field).capability.has('validation')) return 'blur'
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (!isObject(validation) || validation === null || Array.isArray(validation)) return 'blur'

  const trigger = Object.getOwnPropertyDescriptor(validation, 'trigger')?.value
  return trigger === 'input' || trigger === 'submit' ? trigger : 'blur'
}
