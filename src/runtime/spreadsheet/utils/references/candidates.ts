import type {
  SpreadsheetReferenceCandidate,
  SpreadsheetReferenceDefinition,
} from '../../types'
import { getSpreadsheetOptionLabel, getSpreadsheetOptionValue } from '../options'
import { scoreSpreadsheetReferenceCandidate } from './shared'

export function createSpreadsheetReferenceCandidates(params: {
  sourceValue: string
  reference: SpreadsheetReferenceDefinition
  options: readonly unknown[]
}) {
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
