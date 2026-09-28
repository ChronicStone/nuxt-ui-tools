import type {
  FormControlSize,
  FormControlUi,
  FormField,
  FormFieldCallbackParams,
  FormObject,
  FormUiClass,
  FormUiConfig,
  FormValidationTrigger,
  FormValue,
} from '../types'
import { createFormFieldInstance } from './field-instance'
import { isFunction, isNumber, isObject, isString } from './predicate'
import { mergeFormUiClass } from './ui'

/** Props a field control passes to its Nuxt UI component. */
export type FormControlProps = FormObject & {
  size?: FormControlSize
  class?: FormUiClass
  ui?: FormControlUi
  loading?: boolean
  trailing?: boolean
}

/**
 * Resolves the authored `props` of a field, calling them with the field's callback params when
 * they are a function. Anything other than a plain record resolves to no props.
 */
export function resolveFieldProps(field: FormField, params: FormFieldCallbackParams): FormObject {
  const value =
    'props' in field ? Object.getOwnPropertyDescriptor(field, 'props')?.value : undefined
  const result = isFunction(value) ? value(params) : value
  return isObject(result) && result !== null && !Array.isArray(result) ? result : {}
}

/**
 * Resolves the props a field control passes to its Nuxt UI component: the attributes a bare
 * control receives from its cell, the form and field-type UI defaults, then the field's own props
 * without the engine-only keys listed in `omit`. Live controls and inert table cells both render
 * from this, so they look the same.
 */
export function resolveControlProps(input: {
  field: FormField
  fieldProps: FormObject
  attrs: FormObject
  ui: FormUiConfig
  size: FormControlSize
  omit?: readonly string[]
}): FormControlProps {
  const fieldUi = input.ui.fields?.[input.field.type]
  const bareClass = isString(input.attrs.class) ? input.attrs.class : undefined
  const defaults = {
    ...input.attrs,
    class: mergeFormUiClass(bareClass, fieldUi?.class),
    size: fieldUi?.size ?? input.size,
    ui: mergeControlUi(input.attrs.ui, input.ui.control?.ui, fieldUi?.ui),
  }
  const resolved: FormControlProps = {}
  for (const [key, value] of Object.entries(input.fieldProps)) {
    if (!input.omit?.includes(key)) {
      resolved[key] = value
    }
  }
  return {
    ...defaults,
    ...resolved,
    class: mergeControlClass(fieldUi?.class, resolved.class),
    ui: mergeControlUi(input.ui.control?.ui, fieldUi?.ui, resolved.ui),
  }
}

/** Reads a control size, falling back when the value is not one of the Nuxt UI sizes. */
export function resolveControlSize(value: FormValue, fallback: FormControlSize): FormControlSize {
  return isFormControlSize(value) ? value : fallback
}

/** Resolves a field placeholder, static or computed from its callback params. */
export function resolveControlPlaceholder(input: {
  field: FormField
  params: FormFieldCallbackParams
  fallback: string
}) {
  const value = Object.getOwnPropertyDescriptor(input.field, 'placeholder')?.value
  if (isFunction(value)) {
    const resolved = value(input.params)
    return isString(resolved) || isNumber(resolved) ? String(resolved) : input.fallback
  }
  if (isString(value) || isNumber(value)) {
    return String(value)
  }
  return input.fallback
}

/** True when the field's `disabled` callback disables it for its current callback params. */
export function isDisabledByField(field: FormField, params: FormFieldCallbackParams) {
  const value = Object.getOwnPropertyDescriptor(field, 'disabled')?.value
  return isFunction(value) ? value(params) === true : false
}

/** When a field validates: on blur by default, on input, or only on submit. */
export function getValidationTrigger(field: FormField): FormValidationTrigger {
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
