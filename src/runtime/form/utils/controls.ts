import type { FormUiConfig, FormValidationMode, FormValue } from '../types'
import { isRecord } from './path'
import { isBoolean, isString, stringArray } from './predicate'

/** Reads the schema `controls` object. */
export function getSchemaControls(schema: FormValue) {
  if (!isRecord(schema)) {
    return
  }
  const controls = Object.getOwnPropertyDescriptor(schema, 'controls')?.value
  return isRecord(controls) ? controls : undefined
}

function getSchemaControl(schema: FormValue, name: string): FormValue {
  const controls = getSchemaControls(schema)
  return controls ? Object.getOwnPropertyDescriptor(controls, name)?.value : undefined
}

/** Resolves `controls.syncInput`: `true`, a path list, or no synchronization. */
export function getSchemaSyncInput(schema: FormValue): boolean | readonly string[] {
  const value = getSchemaControl(schema, 'syncInput')
  return isBoolean(value) ? value : stringArray(value)
}

/** Resolves `controls.validate`, validating everything by default. */
export function getSchemaValidationMode(schema: FormValue): FormValidationMode {
  const value = getSchemaControl(schema, 'validate')
  return value === false || value === 'required' || value === 'validators' ? value : true
}

/** Resolves `controls.autoFocus`: a raw field path, `true` for the first field, or `false`. */
export function getSchemaAutoFocus(schema: FormValue) {
  const value = getSchemaControl(schema, 'autoFocus')
  return isString(value) || isBoolean(value) ? value : false
}

/** True when `controls.dirtyCheck` enables dirty metadata and reset affordances. */
export function getSchemaDirtyCheck(schema: FormValue) {
  return getSchemaControl(schema, 'dirtyCheck') === true
}

/** Reads `controls.confirmNavOnDirty` as authored. */
export function getSchemaDirtyNavigation(schema: FormValue) {
  return getSchemaControl(schema, 'confirmNavOnDirty')
}

/** Reads the schema-level `ui` overrides. */
export function getSchemaUi(schema: FormValue): FormUiConfig | undefined {
  if (!isRecord(schema)) {
    return undefined
  }
  const value = Object.getOwnPropertyDescriptor(schema, 'ui')?.value
  return isRecord(value) ? value : undefined
}
