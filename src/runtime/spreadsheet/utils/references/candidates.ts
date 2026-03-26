import type {
  SpreadsheetReferenceCandidate,
  SpreadsheetReferenceDefinition,
} from '../../types'
import { isSpreadsheetRecord } from '../object'
import { scoreSpreadsheetReferenceCandidate } from './shared'

export function createSpreadsheetReferenceCandidates(params: {
  sourceValue: string
  reference: SpreadsheetReferenceDefinition
  options: readonly unknown[]
}) {
  return params.options
    .flatMap<SpreadsheetReferenceCandidate>((option) => {
      if (params.reference.optionValue && params.reference.optionLabel) {
        const label = params.reference.optionLabel(option)
        return [{
          value: params.reference.optionValue(option),
          label,
          option,
          score: scoreSpreadsheetReferenceCandidate(params.sourceValue, label),
        }]
      }

      if (!isSpreadsheetRecord(option)) return []
      if (typeof option.label !== 'string') return []
      if (!('value' in option)) return []

      return [{
        value: option.value,
        label: option.label,
        option,
        score: scoreSpreadsheetReferenceCandidate(params.sourceValue, option.label),
      }]
    })
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score
      return left.label.localeCompare(right.label)
    })
}
