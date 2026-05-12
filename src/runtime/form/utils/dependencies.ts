import type { FormField, FormObject } from '../types'
import { getScopedPathValue } from './path'

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

function normalizeFieldDependency(value: unknown): NormalizedFieldDependency | null {
  if (typeof value === 'string') return { source: value, target: value }
  if (!Array.isArray(value)) return null

  const [source, target] = value
  if (typeof source !== 'string' || typeof target !== 'string') return null
  return { source, target }
}
