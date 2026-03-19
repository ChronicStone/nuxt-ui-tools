import type {
  TableFilterOperator,
  TableQueryStateFilterValue,
  TableUiFilterDefinition,
} from '../../types'
import { normalizeFilterDefinition } from '../query-state'

export function createDefaultFilterValue(
  definition: TableUiFilterDefinition | undefined,
): TableQueryStateFilterValue {
  if (!definition) {
    return ''
  }

  const normalizedDefinition = normalizeFilterDefinition(definition)

  if (normalizedDefinition.defaultValue != null) {
    return normalizedDefinition.defaultValue
  }

  switch (normalizedDefinition.kind) {
    case 'option':
      return []
    case 'boolean':
      return true
    case 'number':
      return 0
    case 'date':
      return new Date()
    default:
      return ''
  }
}

export function createFilterValueForOperator(options: {
  definition: TableUiFilterDefinition | undefined
  operator: TableFilterOperator
}): TableQueryStateFilterValue {
  if (
    options.operator === 'between' &&
    (options.definition?.kind === 'number' || options.definition?.kind === 'date')
  ) {
    return { from: undefined, to: undefined }
  }

  return createDefaultFilterValue(options.definition)
}
