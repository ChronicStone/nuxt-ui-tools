import { formFieldKinds } from '../fields'
import type {
  FormField,
  FormFieldCapability,
  FormFieldKindDefinition,
  FormFieldState,
  FormFieldType,
} from '../types'

export type FormFieldKind = FormFieldKindDefinition
export type { FormFieldCapability, FormFieldState }

/**
 * Internal public instance for checking authored field behavior against the field-kind registry.
 *
 * Runtime code should prefer this over ad hoc checks such as `field.type === 'select'`
 * when the question is about capabilities or state model.
 *
 * @example
 * ```ts
 * const field = createFormFieldInstance(rawField)
 *
 * field.type.is('select')
 * field.is('stateful')
 * field.has('options')
 * field.state.is('stateless')
 * field.capability.has('options')
 * field.capability.hasAll(['label', 'validation'])
 * ```
 */
export interface FormFieldInstance<TField extends FormField = FormField> {
  /** Authored field object from the schema. */
  raw: TField
  /** Checks the runtime state model. Shorthand for `field.state.is(...)`. */
  is: (state: FormFieldState) => boolean
  /** Checks whether the runtime state model matches at least one state. */
  isAny: (states: readonly FormFieldState[]) => boolean
  /** Checks whether the field kind declares a capability. Shorthand for `field.capability.has(...)`. */
  has: (capability: FormFieldCapability) => boolean
  /** Checks whether the field kind declares at least one capability. */
  hasAny: (capabilities: readonly FormFieldCapability[]) => boolean
  /** Checks whether the field kind declares every capability. */
  hasAll: (capabilities: readonly FormFieldCapability[]) => boolean
  /** Field type checks. */
  type: {
    /** Authored field type. */
    value: TField['type']
    /** Checks the authored field type. */
    is: (type: FormFieldType) => boolean
    /** Checks whether the authored field type matches at least one type. */
    isAny: (types: readonly FormFieldType[]) => boolean
  }
  /** Field-kind definition resolved from the registry. */
  config: FormFieldKind | null
  /** Field state-model checks. */
  state: {
    /** Runtime state model resolved from the field-kind registry. */
    value: FormFieldState | null
    /** Checks the runtime state model. */
    is: (state: FormFieldState) => boolean
    /** Checks whether the runtime state model matches at least one state. */
    isAny: (states: readonly FormFieldState[]) => boolean
  }
  /** Field capability checks backed by the field-kind registry. */
  capability: {
    /** Checks whether the field kind declares a capability. */
    has: (capability: FormFieldCapability) => boolean
    /** Checks whether the field kind declares at least one capability. */
    hasAny: (capabilities: readonly FormFieldCapability[]) => boolean
    /** Checks whether the field kind declares every capability. */
    hasAll: (capabilities: readonly FormFieldCapability[]) => boolean
  }
}

export function createFormFieldInstance<const TField extends FormField>(
  raw: TField,
): FormFieldInstance<TField> {
  const config = getFormFieldKind(raw.type)
  const state = config?.state ?? null

  function has(capability: FormFieldCapability) {
    return config ? fieldKindHas(config, capability) : false
  }

  function is(expectedState: FormFieldState) {
    return state === expectedState
  }

  return {
    raw,
    is,
    isAny: (states) => states.some(is),
    has,
    hasAny: (capabilities) => capabilities.some(has),
    hasAll: (capabilities) => capabilities.every(has),
    type: {
      value: raw.type,
      is: (type) => raw.type === type,
      isAny: (types) => types.some((type) => raw.type === type),
    },
    config,
    state: {
      value: state,
      is,
      isAny: (states) => states.some(is),
    },
    capability: {
      has,
      hasAny: (capabilities) => capabilities.some(has),
      hasAll: (capabilities) => capabilities.every(has),
    },
  }
}

export function getFormFieldKind(type: FormFieldType | string): FormFieldKind | null {
  return formFieldKinds.find((kind) => kind.type === type) ?? null
}

export function isRegisteredFormFieldType(type: string): type is FormFieldType {
  return getFormFieldKind(type) !== null
}

export function fieldKindHas(kind: FormFieldKind, capability: FormFieldCapability) {
  if (capability === 'value') return kind.state === 'stateful'
  if (capability === 'children') return kind.state === 'passthrough'
  if (capability === 'label') return kind.ui?.label === true
  if (capability === 'description') return kind.ui?.description === true
  if (capability === 'hint') return kind.ui?.hint === true
  if (capability === 'layout') return kind.layout?.item === true || kind.layout?.container === true
  if (capability === 'itemLayout') return kind.layout?.item === true
  if (capability === 'containerLayout') return kind.layout?.container === true
  if (capability === 'options') return kind.options?.enabled === true
  if (capability === 'upload') return kind.upload?.enabled === true
  if (capability === 'validation') return kind.validation === true
  if (capability === 'transform') return kind.transform === true
  if (capability === 'submit') return kind.state === 'stateful'
  return false
}
