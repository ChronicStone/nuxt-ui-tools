import type {
  SpreadsheetReferenceDefinition,
  SpreadsheetResolutionDefinition,
} from '../../types'
import { isSpreadsheetRecord } from '../object'

export function isSpreadsheetResolutionDefinition(
  value: unknown,
): value is SpreadsheetResolutionDefinition {
  return isSpreadsheetRecord(value)
    && 'kind' in value
    && value.kind === 'select'
    && 'targetField' in value
    && 'sourceField' in value
}

export function isSpreadsheetPublicReferenceDefinition(
  value: unknown,
): value is SpreadsheetReferenceDefinition {
  return isSpreadsheetRecord(value)
    && 'kind' in value
    && value.kind === 'select'
    && 'field' in value
    && 'source' in value
}

export function normalizeSpreadsheetRuntimeResolutions(
  entries: readonly unknown[],
): SpreadsheetResolutionDefinition[] {
  return entries.flatMap((entry) => {
    if (isSpreadsheetResolutionDefinition(entry)) return [entry]
    if (!isSpreadsheetPublicReferenceDefinition(entry)) return []

    return [{
      kind: 'select',
      scope: 'reference',
      targetField: entry.field,
      sourceField: entry.source,
      options: entry.options,
      getOptions: entry.getOptions,
      rules: entry.rules,
    }] satisfies readonly SpreadsheetResolutionDefinition[]
  })
}
