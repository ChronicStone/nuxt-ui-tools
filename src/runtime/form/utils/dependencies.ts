import type { FormValue } from '../types'
import type { FormField, FormObject } from '../types'
import { getScopedPathValue } from './path'
import { isString } from './predicate'

interface NormalizedFieldDependency {
  source: string
  target: string
}

export function resolveFieldDependencies(params: {
  field: FormField
  state: FormObject
  parentPath: readonly string[]
}) {
  const output: FormObject = {}
  const dependencies = Object.getOwnPropertyDescriptor(params.field, 'dependencies')?.value
  if (!Array.isArray(dependencies)) return output

  for (const dependency of dependencies) {
    const normalized = normalizeFieldDependency(dependency)
    if (!normalized) continue

    output[normalized.target] = getScopedPathValue(
      params.state,
      normalized.source,
      params.parentPath,
    )
  }

  return output
}

function normalizeFieldDependency(value: FormValue): NormalizedFieldDependency | null {
  if (isString(value)) return { source: value, target: value }
  if (!Array.isArray(value)) return null

  const [source, target] = value
  if (!isString(source) || !isString(target)) return null
  return { source, target }
}
