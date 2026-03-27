import type {
  SpreadsheetReferenceCandidate,
  SpreadsheetReferenceDefinition,
  SpreadsheetResolutionDefinition,
} from '../../types'
import { getSpreadsheetOptionLabel, getSpreadsheetOptionValue } from '../options'
import { normalizeSpreadsheetRuntimeResolutions } from './guards'
import { scoreSpreadsheetReferenceCandidate } from './shared'

export function createSpreadsheetReferenceCandidates(params: {
  sourceValue: string
  reference: SpreadsheetResolutionDefinition | SpreadsheetReferenceDefinition
  options: readonly unknown[]
}) {
  if (!normalizeSpreadsheetRuntimeResolutions([params.reference])[0]) return []

  return params.options
    .flatMap<SpreadsheetReferenceCandidate>((option) => {
      const label = getSpreadsheetOptionLabel(option)
      const value = getSpreadsheetOptionValue(option)
      if (!label || value === undefined) return []

      return [{
        value,
        label,
        option,
        score: scoreSpreadsheetReferenceCandidate(params.sourceValue, label),
      }]
    })
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score
      return left.label.localeCompare(right.label)
    })
}
