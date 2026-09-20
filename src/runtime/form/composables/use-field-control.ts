import { watchWithFilter } from '@vueuse/core'
import { computed, onScopeDispose } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type {
  FormValue,
  FormControlSize,
  FormControlUi,
  FormField,
  FormObject,
  FormUiClass,
  FormValidationTrigger,
} from '../types'
import { isEqualFormValue } from '../utils/compare'
import { createFormFieldInstance } from '../utils/field-instance'
import { cloneFormValue } from '../utils/path'
import { isFunction, isNumber, isObject, isString } from '../utils/predicate'
import { mergeFormUiClass } from '../utils/ui'
import { useFieldOptions } from './use-field-options'
import { useFormFieldControlAttrs } from './use-form-field-chrome'
import { useFormRuntimeContext } from './use-form-runtime'
import { useFormUi } from './use-form-ui'

type ResolveDynamicProps<TProps> = TProps extends (...args: never[]) => infer TResult
  ? TResult
  : TProps

export type ResolvedFieldProps<TField> = TField extends { props?: infer TProps }
  ? Partial<ResolveDynamicProps<NonNullable<TProps>>>
  : FormObject

export interface UseFieldControlOptions {
  /** Engine-only props that must not reach the Nuxt UI control as attributes. */
  omit?: readonly string[]
}

export function useResolvedFieldProps<TField extends FormField>(
  field: () => TField,
  path: () => readonly string[],
) {
  const form = useFormRuntimeContext()
  const params = computed(() => form.getFieldCallbackParams(path(), field()))
  return computed(() => {
    const current = field()
    const value =
      'props' in current ? Object.getOwnPropertyDescriptor(current, 'props')?.value : undefined
    const result = isFunction(value) ? value(params.value) : value
    const resolved: FormObject =
      isObject(result) && result !== null && !Array.isArray(result) ? result : {}
    // SAFETY: resolved is the authored `props` of TField after dynamic resolution; the schema type is the only contract the runtime has for it.
    return resolved as ResolvedFieldProps<TField>
  })
}

export function useFieldControl<TField extends FormField>(
  field: () => TField,
  path: () => readonly string[],
  controlOptions: UseFieldControlOptions = {},
) {
  const form = useFormRuntimeContext()
  const formUi = useFormUi()
  const { t } = useUiToolsLocale()
  const fieldControlAttrs = useFormFieldControlAttrs()
  const api = computed(() => form.getFieldApi(path(), field()))
  const params = computed(() => form.getFieldCallbackParams(path(), field()))
  const options = useFieldOptions({
    api,
    callbackParams: params,
    field,
    path,
    refreshFieldOptions: form.refreshFieldOptions,
    register: form.registerFieldOptions,
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
  const fieldProps = useResolvedFieldProps(field, path)
  const resolvedProps = computed<FormObject>(() => {
    // SAFETY: the resolved props are a plain record; the typed view only narrows known keys.
    const record = fieldProps.value as FormObject
    return record
  })
  const controlProps = computed<FormControlProps>(() => {
    const current = field()
    const fieldUi = formUi.ui.value.fields?.[current.type]
    const bareClass = isString(fieldControlAttrs.value.class)
      ? fieldControlAttrs.value.class
      : undefined
    const defaults = {
      ...fieldControlAttrs.value,
      class: mergeFormUiClass(bareClass, fieldUi?.class),
      size: fieldUi?.size ?? formUi.controlSize.value,
      ui: mergeControlUi(fieldControlAttrs.value.ui, formUi.ui.value.control?.ui, fieldUi?.ui),
    }
    const resolved: FormControlProps = {}
    for (const [key, value] of Object.entries(resolvedProps.value)) {
      if (!controlOptions.omit?.includes(key)) {
        resolved[key] = value
      }
    }
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
    return (
      disabledByCallback ||
      form.actionPending.value !== null ||
      (options.disableOnLoading.value && options.loading.value)
    )
  })

  const placeholder = computed(() => {
    const current = field()
    const value = Object.getOwnPropertyDescriptor(current, 'placeholder')?.value
    if (isFunction(value)) {
      const resolved = value(params.value)
      return isString(resolved) || isNumber(resolved)
        ? String(resolved)
        : t('form.fields.text.defaultPlaceholder')
    }
    if (isString(value) || isNumber(value)) {
      return String(value)
    }

    return t('form.fields.text.defaultPlaceholder')
  })

  let lastValue = cloneFormValue(form.getValue(path()))
  watchWithFilter(
    () => form.getValue(path()),
    async (value) => {
      if (isEqualFormValue(value, lastValue)) {
        return
      }
      lastValue = cloneFormValue(value)
      api.value.validation.clearError()
      if (!createFormFieldInstance(field()).capability.has('validation')) {
        return
      }
      const trigger = getValidationTrigger(field())
      if (trigger === 'submit') {
        return
      }
      if (trigger === 'blur' && !form.isFieldTouched(path())) {
        return
      }

      if (trigger === 'input') {
        form.markFieldTouched(path())
      }
      await api.value.validation.validate()
    },
    { deep: true },
  )

  let blurBoundaryListening = false
  onScopeDispose(stopBlurBoundaryWatch)

  function handleBlur(event?: Event) {
    if (!canBlurValidate()) {
      return
    }

    const relatedTarget = event instanceof FocusEvent ? event.relatedTarget : null
    if (isOwnedOverlayTarget(relatedTarget)) {
      startBlurBoundaryWatch()
      return
    }
    if (isFieldRootTarget(relatedTarget)) {
      return
    }

    setTimeout(() => {
      if (isFieldRootTarget(document.activeElement)) {
        return
      }
      if (isOwnedOverlayTarget(document.activeElement)) {
        startBlurBoundaryWatch()
        return
      }
      if (document.activeElement === document.body && hasOwnedInteractionSurface()) {
        startBlurBoundaryWatch()
        return
      }

      commitBlurValidation()
    }, 0)
  }

  function canBlurValidate() {
    if (!createFormFieldInstance(field()).capability.has('validation')) {
      return false
    }
    return getValidationTrigger(field()) !== 'submit'
  }

  function commitBlurValidation() {
    stopBlurBoundaryWatch()
    if (!canBlurValidate()) {
      return
    }

    const trigger = getValidationTrigger(field())
    form.markFieldTouched(path())
    if (trigger === 'input') {
      return
    }
    void api.value.validation.validate()
  }

  function startBlurBoundaryWatch() {
    if (blurBoundaryListening) {
      return
    }
    blurBoundaryListening = true
    document.addEventListener('focusin', handleBoundaryFocusIn, true)
    document.addEventListener('pointerdown', handleBoundaryPointerDown, true)
  }

  function stopBlurBoundaryWatch() {
    if (!blurBoundaryListening) {
      return
    }
    blurBoundaryListening = false
    document.removeEventListener('focusin', handleBoundaryFocusIn, true)
    document.removeEventListener('pointerdown', handleBoundaryPointerDown, true)
  }

  function handleBoundaryFocusIn(event: FocusEvent) {
    if (isFieldRootTarget(event.target)) {
      stopBlurBoundaryWatch()
      return
    }
    if (isOwnedOverlayTarget(event.target)) {
      return
    }
    commitBlurValidation()
  }

  function handleBoundaryPointerDown(event: PointerEvent) {
    if (isFieldRootTarget(event.target) || isOwnedOverlayTarget(event.target)) {
      return
    }
    setTimeout(commitBlurValidation, 0)
  }

  function isFieldRootTarget(target: EventTarget | null) {
    if (!(target instanceof Node)) {
      return false
    }
    const owner = interactionOwner.value
    for (const element of document.querySelectorAll<HTMLElement>('[data-form-field]')) {
      if (element.dataset.formField === owner && element.contains(target)) {
        return true
      }
    }
    return false
  }

  function isOwnedOverlayTarget(target: EventTarget | null) {
    if (!(target instanceof Node)) {
      return false
    }
    for (const element of document.getElementsByClassName(interactionOwnerClass.value)) {
      if (element.contains(target)) {
        return true
      }
    }
    return false
  }

  function hasOwnedInteractionSurface() {
    return document.getElementsByClassName(interactionOwnerClass.value).length > 0
  }

  return {
    api,
    controlProps,
    controlSize,
    disabled,
    fieldProps,
    form,
    handleBlur,
    interactionOwner,
    interactionOwnerClass,
    options,
    params,
    placeholder,
    validationPending,
  }
}

function mergeControlUi(...configs: readonly FormValue[]): FormControlUi {
  const merged: FormControlUi = {}
  for (const config of configs) {
    if (!isObject(config) || config === null || Array.isArray(config)) {
      continue
    }
    for (const [slot, value] of Object.entries(config)) {
      if (isString(value)) {
        merged[slot] = value
      }
    }
  }
  return merged
}

function mergeControlClass(defaults: string | undefined, local: FormValue) {
  return isString(local) ? mergeFormUiClass(defaults, local) : defaults
}

function isFormControlSize(value: FormValue): value is FormControlSize {
  return value === 'xs' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl'
}

function getValidationTrigger(field: FormField): FormValidationTrigger {
  if (!createFormFieldInstance(field).capability.has('validation')) {
    return 'blur'
  }
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (!isObject(validation) || validation === null || Array.isArray(validation)) {
    return 'blur'
  }

  const trigger = Object.getOwnPropertyDescriptor(validation, 'trigger')?.value
  return trigger === 'input' || trigger === 'submit' ? trigger : 'blur'
}
