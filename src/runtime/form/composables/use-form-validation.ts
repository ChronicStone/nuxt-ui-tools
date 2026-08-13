import { computed, ref } from 'vue'

import type {
  FormField,
  FormObject,
  FormRuntimeContext,
  FormValidationError,
  FormValidationMode,
} from '../types'
import {
  collectFormFieldsPaths,
  fieldPath,
  validateFormFields,
  validateFormState,
} from '../utils/state'
import type { FormFieldApiFactory } from './use-form-state'

export function useFormValidation(params: {
  schema: () => unknown
  state: FormObject
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
  getValidationMode: () => FormValidationMode
}) {
  const validationErrors = ref<readonly FormValidationError[]>([])
  const customErrors = ref<readonly FormValidationError[]>([])
  const touchedPaths = ref<readonly string[]>([])
  const validationRuns = new Map<string, number>()
  const errors = computed(() => [...validationErrors.value, ...customErrors.value])

  async function validate() {
    validationErrors.value = await validateFormState(
      params.schema(),
      params.state,
      params.context,
      params.apiFactory,
      params.getValidationMode(),
    )
    touchErrorPaths(validationErrors.value)
    return errors.value.length === 0
  }

  async function validateFields(fields: readonly FormField[], parentPath: readonly string[]) {
    const key = scopeKey(fields, parentPath)
    const run = (validationRuns.get(key) ?? 0) + 1
    validationRuns.set(key, run)

    const nextErrors = await validateFormFields({
      fields,
      state: params.state,
      ctx: params.context,
      apiFactory: params.apiFactory,
      parentPath,
      mode: params.getValidationMode(),
    })
    if (validationRuns.get(key) !== run) return nextErrors.length === 0

    const fieldKeys = collectFormFieldsPaths(fields, parentPath)
    touchPaths(fieldKeys)
    const retained = validationErrors.value.filter(
      (error) =>
        !fieldKeys.some(
          (fieldKey) => error.path === fieldKey || error.path.startsWith(`${fieldKey}.`),
        ),
    )
    validationErrors.value = [...retained, ...nextErrors]

    return nextErrors.length === 0
  }

  function getFieldError(path: readonly string[]) {
    const key = path.join('.')
    const customError = customErrors.value.find((error) => error.path === key)
    if (customError) return customError.message
    if (!touchedPaths.value.includes(key)) return undefined

    return validationErrors.value.find((error) => error.path === key)?.message
  }

  function setError(path: readonly string[], message: string) {
    const key = path.join('.')
    customErrors.value = [
      ...customErrors.value.filter((error) => error.path !== key),
      { path: key, message },
    ]
  }

  function clearError(path?: readonly string[]) {
    if (!path) {
      validationErrors.value = []
      customErrors.value = []
      touchedPaths.value = []
      return
    }

    const key = path.join('.')
    validationErrors.value = validationErrors.value.filter((error) => error.path !== key)
    customErrors.value = customErrors.value.filter((error) => error.path !== key)
  }

  function markTouched(path: readonly string[]) {
    touchPaths([path.join('.')])
  }

  function markAllTouched(paths: readonly string[]) {
    touchPaths(paths)
  }

  function isTouched(path: readonly string[]) {
    const key = path.join('.')
    return touchedPaths.value.includes(key)
  }

  function touchPaths(paths: readonly string[]) {
    touchedPaths.value = unique([...touchedPaths.value, ...paths.filter(Boolean)])
  }

  function touchErrorPaths(nextErrors: readonly FormValidationError[]) {
    touchPaths(nextErrors.map((error) => error.path))
  }

  return {
    errors,
    validate,
    validateFields,
    getFieldError,
    setError,
    clearError,
    markTouched,
    markAllTouched,
    isTouched,
  }
}

function scopeKey(fields: readonly FormField[], parentPath: readonly string[]) {
  return (
    fields.map((field) => fieldPath(parentPath, field).join('.')).join('|') ||
    parentPath.join('.') ||
    '$form'
  )
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}
