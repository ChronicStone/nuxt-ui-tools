import type {
  FormField,
  FormObject,
  FormPageSection,
  FormPageSectionEntry,
  FormPageSectionState,
  FormRuntime,
  FormText,
  FormValue,
} from '../types'
import { createFormFieldInstance } from './field-instance'
import { getPathValue, isRecord } from './path'
import { isBoolean, isFunction, isNumber, isString } from './predicate'
import {
  fieldPath,
  getChildFields,
  getSchemaFields,
  isEmptyValue,
  isFlatPassthroughField,
  isObjectContainerField,
  resolveRequired,
} from './state'
import { resolveFormText } from './text'

interface FormPageLeaf {
  field: FormField
  path: readonly string[]
}

/** Pairs each section of a page schema with the card `defineFormPageSchema` generated for it. */
export function getFormPageSections(schema: FormValue): readonly FormPageSectionEntry[] {
  if (!isRecord(schema) || !Array.isArray(schema.sections)) {
    return []
  }
  const cards = getSchemaFields(schema)
  return schema.sections.filter(isFormPageSection).flatMap((section) => {
    const card = cards.find((field) => field.key === section.key)
    return card ? [{ card, section }] : []
  })
}

/** Resolved heading of the page navigation. */
export function getFormPageNavigationTitle(schema: FormValue) {
  if (!isRecord(schema) || !isRecord(schema.navigation)) {
    return undefined
  }
  const { title } = schema.navigation
  return isFormText(title) ? resolveFormText(title) : undefined
}

/** True while the section's `condition` lets it render. */
export function isFormPageSectionVisible(entry: FormPageSectionEntry, runtime: FormRuntime) {
  return !hasCondition(entry.card) || runtime.shouldRender(entry.card, [entry.card.key])
}

/**
 * Live state of one visible section: what it still misses, whether it shows errors, and what
 * changed since the baseline.
 */
export function resolveFormPageSectionState(params: {
  entry: FormPageSectionEntry
  index: number
  runtime: FormRuntime
  /** Input the form was opened with: a value it provides counts as filled in. */
  input: FormObject | undefined
  /** False when the validation mode does not enforce required fields. */
  requiredEnforced: boolean
}): FormPageSectionState {
  const { entry, runtime } = params
  const leaves = collectVisibleLeaves(entry.section.fields, [], runtime)
  const paths = leaves.map((leaf) => leaf.path.join('.'))
  const contains = (candidate: string) => paths.some((path) => isPathWithin(candidate, path))
  const dirtyPaths = runtime.dirtyPaths.value.filter(contains)
  const invalid = runtime.errors.value.some((error) => contains(error.path))
  const required = params.requiredEnforced
    ? leaves.filter((leaf) => isRequiredLeaf(leaf, runtime))
    : []
  const missing = required.filter((leaf) => isEmptyValue(runtime.getValue(leaf.path))).length
  const optional = entry.section.optional === true || required.length === 0
  const filled =
    !optional || leaves.some((leaf) => isProvided(leaf, runtime, dirtyPaths, params.input))

  return {
    description: resolveFormText(entry.section.description),
    dirty: dirtyPaths.length > 0,
    dirtyPaths,
    index: params.index,
    key: entry.section.key,
    label: resolveFormText(entry.section.label) ?? entry.section.key,
    missing,
    optional,
    status: invalid ? 'invalid' : missing === 0 && filled ? 'complete' : 'pending',
  }
}

/** Stateful fields of a section that render now, with containers flattened. */
function collectVisibleLeaves(
  fields: readonly FormField[],
  parentPath: readonly string[],
  runtime: FormRuntime,
): readonly FormPageLeaf[] {
  return fields.flatMap((field) => {
    if (field.ignore === true) {
      return []
    }
    const path = fieldPath(parentPath, field)
    if (hasCondition(field) && !runtime.shouldRender(field, path)) {
      return []
    }
    if (createFormFieldInstance(field).state.is('stateless')) {
      return []
    }
    if (isFlatPassthroughField(field)) {
      return collectVisibleLeaves(getChildFields(field), parentPath, runtime)
    }
    if (isObjectContainerField(field)) {
      return collectVisibleLeaves(getChildFields(field), path, runtime)
    }
    return [{ field, path }]
  })
}

function isRequiredLeaf(leaf: FormPageLeaf, runtime: FormRuntime) {
  const required = Object.getOwnPropertyDescriptor(leaf.field, 'required')?.value
  if (isBoolean(required)) {
    return required
  }
  const validation = Object.getOwnPropertyDescriptor(leaf.field, 'validation')?.value
  if (!isFunction(required) && !isRecord(validation)) {
    return false
  }
  return resolveRequired(leaf.field, runtime.getFieldCallbackParams(leaf.path, leaf.field)) === true
}

/** A value the user entered, or one the form input brought: defaults alone do not count. */
function isProvided(
  leaf: FormPageLeaf,
  runtime: FormRuntime,
  dirtyPaths: readonly string[],
  input: FormObject | undefined,
) {
  if (isEmptyValue(runtime.getValue(leaf.path))) {
    return false
  }
  const path = leaf.path.join('.')
  return (
    dirtyPaths.some((dirtyPath) => isPathWithin(dirtyPath, path)) ||
    !isEmptyValue(getPathValue(input ?? {}, leaf.path))
  )
}

function hasCondition(field: FormField) {
  return isFunction(Object.getOwnPropertyDescriptor(field, 'condition')?.value)
}

function isPathWithin(path: string, scope: string) {
  return path === scope || path.startsWith(`${scope}.`)
}

function isFormPageSection(value: FormValue): value is FormPageSection {
  return (
    isRecord(value) && isString(value.key) && isFormText(value.label) && Array.isArray(value.fields)
  )
}

function isFormText(value: FormValue): value is FormText {
  return isString(value) || isNumber(value) || isFunction(value)
}
