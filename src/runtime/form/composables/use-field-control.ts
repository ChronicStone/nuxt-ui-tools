import { watchWithFilter } from '@vueuse/core'
import { computed, onScopeDispose } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { FormField, FormObject, FormRuntime, FormValue } from '../types'
import { isEqualFormValue } from '../utils/compare'
import {
  getValidationTrigger,
  isDisabledByField,
  resolveControlPlaceholder,
  resolveControlProps,
  resolveControlSize,
  resolveFieldProps,
} from '../utils/field-control'
import { createFormFieldInstance } from '../utils/field-instance'
import { cloneFormValue } from '../utils/path'
import { staticFieldOptions, useFieldOptions } from './use-field-options'
import { useFormFieldControlAttrs, useFormFieldWatchOwner } from './use-form-field-chrome'
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
    const resolved = resolveFieldProps(field(), params.value)
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
  const watchOwner = useFormFieldWatchOwner()
  const api = computed(() => form.getFieldApi(path(), field()))
  const params = computed(() => form.getFieldCallbackParams(path(), field()))
  const options = createFormFieldInstance(field()).capability.has('options')
    ? useFieldOptions({
        api,
        callbackParams: params,
        field,
        path,
        refreshFieldOptions: form.refreshFieldOptions,
        register: form.registerFieldOptions,
      })
    : staticFieldOptions()
  const validationPending = computed<boolean>(() => api.value.validation.pending())
  const interactionOwner = computed<string>(() => path().join('.'))
  const interactionOwnerClass = computed<string>(
    () => `nut-form-field-owner:${encodeURIComponent(interactionOwner.value)}`,
  )

  const fieldProps = useResolvedFieldProps(field, path)
  const controlProps = computed(() =>
    resolveControlProps({
      attrs: fieldControlAttrs.value,
      field: field(),
      // SAFETY: the resolved props are a plain record; the typed view only narrows known keys.
      fieldProps: fieldProps.value as FormObject,
      omit: controlOptions.omit,
      size: formUi.controlSize.value,
      ui: formUi.ui.value,
    }),
  )
  const controlSize = computed(() =>
    resolveControlSize(controlProps.value.size, formUi.controlSize.value),
  )

  const disabled = computed(
    () =>
      isDisabledByField(field(), params.value) ||
      form.actionPending.value !== null ||
      (options.disableOnLoading.value && options.loading.value),
  )

  const placeholder = computed(() =>
    resolveControlPlaceholder({
      fallback: t('form.fields.text.defaultPlaceholder'),
      field: field(),
      params: params.value,
    }),
  )

  if (!watchOwner(path())) {
    useFieldValidationWatch(field, path)
  }

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

/**
 * Reacts to a new value of a field: clears its error, then validates it again when it validates
 * on input, or on blur once touched. Nothing happens while the value equals the last one seen.
 */
export function createFieldValueValidation(
  form: FormRuntime,
  target: { field: () => FormField; path: () => readonly string[] },
) {
  let lastValue = cloneFormValue(form.getValue(target.path()))
  return async (value: FormValue) => {
    if (isEqualFormValue(value, lastValue)) {
      return
    }
    lastValue = cloneFormValue(value)
    const field = target.field()
    const path = target.path()
    const api = form.getFieldApi(path, field)
    api.validation.clearError()
    if (!createFormFieldInstance(field).capability.has('validation')) {
      return
    }
    const trigger = getValidationTrigger(field)
    if (trigger === 'submit') {
      return
    }
    if (trigger === 'blur' && !form.isFieldTouched(path)) {
      return
    }
    if (trigger === 'input') {
      form.markFieldTouched(path)
    }
    await api.validation.validate()
  }
}

/**
 * Validates a field when its value changes, once the form has painted: nobody edits a field
 * before that. Array-table rows run this for their cells, live or not, instead of each control.
 */
export function useFieldValidationWatch(field: () => FormField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const onValue = createFieldValueValidation(form, { field, path })
  form.paint.afterPaint(() => watchWithFilter(() => form.getValue(path()), onValue, { deep: true }))
}
