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
  getArrayItemFields,
  getChildFields,
  getSchemaFields,
  isArrayField,
  isEmptyValue,
  isFlatPassthroughField,
  isObjectContainerField,
  resolveRequired,
} from './state'
import { resolveFormText } from './text'

export interface FormPageLeaf {
  field: FormField
  path: readonly string[]
  /** True for a field of an array item, which never makes its section required. */
  item: boolean
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
 * Stateful fields of a section that render now. They change with the form's structure (items,
 * conditions) rather than with its values, so a page keeps them apart from the section state.
 */
export function collectFormPageLeaves(entry: FormPageSectionEntry, runtime: FormRuntime) {
  const leaves = collectVisibleLeaves(entry.section.fields, [], runtime)
  return { leaves, paths: new Set(leaves.map((leaf) => leaf.path.join('.'))) }
}

/**
 * Live state of one visible section: what it still misses, whether it shows errors, and what
 * changed since the baseline.
 */
export function resolveFormPageSectionState(params: {
  entry: FormPageSectionEntry
  index: number
  runtime: FormRuntime
  /** The section's leaves, from `collectFormPageLeaves`. */
  leaves: ReturnType<typeof collectFormPageLeaves>
  /** Input the form was opened with: a value it provides counts as filled in. */
  input: FormObject | undefined
  /** False when the validation mode does not enforce required fields. */
  requiredEnforced: boolean
}): FormPageSectionState {
  const { entry, runtime } = params
  const { leaves, paths } = params.leaves
  const dirtyPaths = runtime.dirtyPaths.value.filter((path) => isWithinAny(path, paths))
  const invalid = runtime.errors.value.some((error) => isWithinAny(error.path, paths))
  const required = params.requiredEnforced
    ? leaves.filter((leaf) => isRequiredLeaf(leaf, runtime))
    : []
  const missing = required.filter((leaf) => isEmptyValue(runtime.getValue(leaf.path))).length
  const optional = entry.section.optional ?? required.every((leaf) => leaf.item)
  const modified = new Set(dirtyPaths.flatMap(pathPrefixes))
  const filled =
    !optional || leaves.some((leaf) => isProvided(leaf, runtime, modified, params.input))

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

/**
 * Stateful fields of a section that render now, with containers flattened. An array counts as a
 * field, and the fields of each of its items follow it.
 */
function collectVisibleLeaves(
  fields: readonly FormField[],
  parentPath: readonly string[],
  runtime: FormRuntime,
  item = false,
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
      return collectVisibleLeaves(getChildFields(field), parentPath, runtime, item)
    }
    if (isObjectContainerField(field)) {
      return collectVisibleLeaves(getChildFields(field), path, runtime, item)
    }
    if (isArrayField(field)) {
      return [{ field, item, path }, ...collectArrayItemLeaves(field, path, runtime)]
    }
    return [{ field, item, path }]
  })
}

function collectArrayItemLeaves(
  field: FormField,
  path: readonly string[],
  runtime: FormRuntime,
): readonly FormPageLeaf[] {
  const items = runtime.getValue(path)
  if (!Array.isArray(items)) {
    return []
  }
  return items.flatMap((value: FormValue, index) =>
    isRecord(value)
      ? collectVisibleLeaves(
          getArrayItemFields(field, value),
          [...path, String(index)],
          runtime,
          true,
        )
      : [],
  )
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

/**
 * A value the user entered, or one the form input brought: defaults alone do not count.
 * `modified` holds every modified path and the paths around it.
 */
function isProvided(
  leaf: FormPageLeaf,
  runtime: FormRuntime,
  modified: ReadonlySet<string>,
  input: FormObject | undefined,
) {
  if (isEmptyValue(runtime.getValue(leaf.path))) {
    return false
  }
  return modified.has(leaf.path.join('.')) || !isEmptyValue(getPathValue(input ?? {}, leaf.path))
}

function hasCondition(field: FormField) {
  return isFunction(Object.getOwnPropertyDescriptor(field, 'condition')?.value)
}

/** True when `path` is one of `scopes` or inside one, checking its prefixes rather than each scope. */
function isWithinAny(path: string, scopes: ReadonlySet<string>) {
  return pathPrefixes(path).some((prefix) => scopes.has(prefix))
}

/** `a.b.c`, `a.b`, and `a`. */
function pathPrefixes(path: string) {
  const segments = path.split('.')
  return segments.map((_, index) => segments.slice(0, segments.length - index).join('.'))
}

function isFormPageSection(value: FormValue): value is FormPageSection {
  return (
    isRecord(value) && isString(value.key) && isFormText(value.label) && Array.isArray(value.fields)
  )
}

function isFormText(value: FormValue): value is FormText {
  return isString(value) || isNumber(value) || isFunction(value)
}
