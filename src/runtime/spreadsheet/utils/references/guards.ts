import type {
  SpreadsheetReferenceDefinition,
  SpreadsheetResolutionDefinition,
  SpreadsheetValue,
} from '../../types'
import { isSpreadsheetRecord } from '../object'

export function isSpreadsheetResolutionDefinition(
  value: SpreadsheetValue,
): value is SpreadsheetResolutionDefinition {
  return (
    isSpreadsheetRecord(value) &&
    'kind' in value &&
    value.kind === 'select' &&
    'targetField' in value &&
    'sourceField' in value
  )
}

export function isSpreadsheetPublicReferenceDefinition(
  value: SpreadsheetValue,
): value is SpreadsheetReferenceDefinition {
  return (
    isSpreadsheetRecord(value) &&
    'kind' in value &&
    value.kind === 'select' &&
    'field' in value &&
    'source' in value
  )
}

export function normalizeSpreadsheetRuntimeResolutions(
  entries: readonly unknown[],
): SpreadsheetResolutionDefinition[] {
  return entries.flatMap((entry) => {
    if (isSpreadsheetResolutionDefinition(entry)) {
      return [entry]
    }
    if (!isSpreadsheetPublicReferenceDefinition(entry)) {
      return []
    }

    return [
      {
        getOptions: entry.getOptions,
        kind: 'select',
        options: entry.options,
        rules: entry.rules,
        scope: 'reference',
        sourceField: entry.source,
        targetField: entry.field,
      },
    ] satisfies readonly SpreadsheetResolutionDefinition[]
  })
}
