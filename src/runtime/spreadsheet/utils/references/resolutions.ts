import type {
  SpreadsheetParsedRow,
  SpreadsheetReferenceQueryRequest,
  SpreadsheetReferenceResolution,
  SpreadsheetResolvedReferenceRow,
  SpreadsheetRowIssue,
} from '../../types'
import {
  cloneSpreadsheetRowData,
  getSpreadsheetValueAtPath,
  setSpreadsheetValueAtPath,
} from '../object'
import { createSpreadsheetReferenceCandidates } from './candidates'
import { isSpreadsheetReferenceDefinition } from './guards'
import { collectSpreadsheetReferenceSources } from './sources'

export function createSpreadsheetReferenceResolutions(params: {
  references: readonly unknown[]
  rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[]
}) {
  return collectSpreadsheetReferenceSources(params.references, params.rows)
    .flatMap(({ reference, entries }) =>
      entries.map<SpreadsheetReferenceResolution>((entry) => {
        const candidates = createSpreadsheetReferenceCandidates({
          sourceValue: entry.value,
          reference,
          options: reference.options ?? [],
        })
        const bestCandidate = candidates[0]
        const isMatched = Boolean(bestCandidate && bestCandidate.score >= 0.9)

        return {
          referenceField: reference.field,
          sourceField: reference.source,
          outputField: reference.field,
          sourceValue: entry.value,
          rowIndexes: entry.rowIndexes,
          status: isMatched ? 'matched' : 'unresolved',
          selectedValue: isMatched ? bestCandidate?.value : undefined,
          selectedLabel: isMatched ? bestCandidate?.label : undefined,
          candidates,
        }
      }),
    )
}

export function applySpreadsheetReferenceResolutions(params: {
  rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[]
  resolutions: readonly SpreadsheetReferenceResolution[]
}) {
  return params.rows.map<SpreadsheetResolvedReferenceRow<Record<string, unknown>>>((row) => {
    const data = cloneSpreadsheetRowData(row.data)
    const issues: SpreadsheetRowIssue[] = [...row.issues]

    for (const resolution of params.resolutions) {
      const sourceValue = String(getSpreadsheetValueAtPath(row.data, resolution.sourceField) ?? '').trim()
      if (!sourceValue) continue
      if (sourceValue !== resolution.sourceValue) continue

      if (resolution.selectedValue !== undefined) {
        setSpreadsheetValueAtPath(data, resolution.outputField, resolution.selectedValue)
        continue
      }

      issues.push({
        level: 'error',
        code: 'reference.unresolved',
        message: `Unresolved reference "${sourceValue}"`,
        rowIndex: row.index,
        columnKey: resolution.outputField,
      })
    }

    return {
      index: row.index,
      source: row.source,
      data,
      issues,
      isValid: issues.every((issue) => issue.level !== 'error'),
    }
  })
}

export function createSpreadsheetReferenceQueryRequests(params: {
  references: readonly unknown[]
  rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[]
  context: Record<string, unknown>
}) {
  return createSpreadsheetReferenceResolutions({
    references: params.references,
    rows: params.rows,
  }).flatMap<SpreadsheetReferenceQueryRequest>((resolution) => {
    const referenceEntry = params.references.find((entry) =>
      isSpreadsheetReferenceDefinition(entry) && entry.field === resolution.referenceField,
    )
    if (!isSpreadsheetReferenceDefinition(referenceEntry)) return []

    const reference = referenceEntry
    if (!reference.getOptions || resolution.status === 'matched') return []

    const sourceRow = params.rows.find((row) => row.index === resolution.rowIndexes[0])
    if (!sourceRow) return []

      return [{
      referenceField: reference.field,
      sourceValue: resolution.sourceValue,
      query: reference.getOptions({
        context: params.context,
        row: sourceRow.data,
        search: resolution.sourceValue,
      }),
    }]
  })
}
