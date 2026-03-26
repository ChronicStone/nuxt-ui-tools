import type { SpreadsheetReferenceDefinition } from '../../types'
import { isSpreadsheetRecord } from '../object'

export function isSpreadsheetReferenceDefinition(
  value: unknown,
): value is SpreadsheetReferenceDefinition {
  return isSpreadsheetRecord(value)
    && 'kind' in value
    && value.kind === 'select'
    && 'field' in value
    && 'source' in value
}
