import type { FormDependencies, FormValue, FormField, FormObject } from '../types'
import { getScopedPathValue } from './path'
import { isString } from './predicate'

interface NormalizedFieldDependency {
  source: string
  target: string
}

const dependencyValues = new WeakMap<FormDependencies, FormObject>()

/**
 * Resolves a field's declared dependencies against the form state, each under its target name.
 */
export function resolveFieldDependencies(params: {
  field: FormField
  state: FormObject
  parentPath: readonly string[]
}) {
  const values: FormObject = {}
  const dependencies = Object.getOwnPropertyDescriptor(params.field, 'dependencies')?.value
  if (Array.isArray(dependencies)) {
    for (const dependency of dependencies) {
      const normalized = normalizeFieldDependency(dependency)
      if (!normalized) {
        continue
      }

      values[normalized.target] = getScopedPathValue(
        params.state,
        normalized.source,
        params.parentPath,
      )
    }
  }

  return createFormDependencies(values)
}

/**
 * Wraps resolved dependency values in the reader field callbacks receive.
 */
export function createFormDependencies(values: FormObject) {
  const dependencies: FormDependencies = {
    // SAFETY: the callback states the type it expects from a dependency it declared; the engine
    // holds untyped form values and does not validate them, as the `get` contract documents.
    get: <TValue>(key: string) => values[key] as TValue,
  }
  dependencyValues.set(dependencies, values)
  return dependencies
}

/**
 * The plain values behind a dependency reader, for the engine's own change detection.
 */
export function readFormDependencyValues(dependencies: FormDependencies) {
  return dependencyValues.get(dependencies) ?? {}
}

function normalizeFieldDependency(value: FormValue): NormalizedFieldDependency | null {
  if (isString(value)) {
    return { source: value, target: value }
  }
  if (!Array.isArray(value)) {
    return null
  }

  const [source, target] = value
  if (!isString(source) || !isString(target)) {
    return null
  }
  return { source, target }
}
