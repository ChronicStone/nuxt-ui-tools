import type {
  SpreadsheetParsedRow,
  SpreadsheetReferenceQueryRequest,
  SpreadsheetRelationDefinition,
  SpreadsheetReferenceResolution,
  SpreadsheetResolvedReferenceRow,
  SpreadsheetRowIssue,
} from '../../types'
import {
  cloneSpreadsheetRowData,
  getSpreadsheetValueAtPath,
  setSpreadsheetValueAtPath,
} from '../object'
import { resolveSpreadsheetOptionEntries } from '../options'
import { executeSpreadsheetRules, resolveSpreadsheetRelationRules } from '../validation/core'
import { createSpreadsheetReferenceCandidates } from './candidates'
import { isSpreadsheetReferenceDefinition } from './guards'
import { collectSpreadsheetReferenceSources, collectSpreadsheetReferenceTokens } from './sources'

function isSpreadsheetRelationDefinition(
  value: unknown,
): value is SpreadsheetRelationDefinition<Record<string, unknown>> {
  return value !== null
    && typeof value === 'object'
    && 'column' in value
    && typeof value.column === 'string'
    && 'rules' in value
    && typeof value.rules === 'function'
}

export function createSpreadsheetReferenceResolutions(params: {
  references: readonly unknown[]
  rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[]
  context: Record<string, unknown>
}) {
  return collectSpreadsheetReferenceSources(params.references, params.rows)
    .flatMap(({ reference, entries }) =>
      entries.map<SpreadsheetReferenceResolution>((entry) => {
        const candidates = createSpreadsheetReferenceCandidates({
          sourceValue: entry.value,
          reference,
          options: resolveSpreadsheetOptionEntries(reference.options, {
            context: params.context,
          }),
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
  relations?: readonly unknown[]
}) {
  const resolutionsBySourceField = params.resolutions.reduce<Map<string, SpreadsheetReferenceResolution[]>>((groups, resolution) => {
    const entries = groups.get(resolution.sourceField) ?? []
    groups.set(resolution.sourceField, [...entries, resolution])
    return groups
  }, new Map<string, SpreadsheetReferenceResolution[]>())

  return params.rows.map<SpreadsheetResolvedReferenceRow<Record<string, unknown>>>((row) => {
    const data = cloneSpreadsheetRowData(row.data)
    const issues: SpreadsheetRowIssue[] = [...row.issues]
    const multiValueOutputs = new Map<string, unknown[]>()

    for (const [sourceField, resolutions] of resolutionsBySourceField.entries()) {
      const rawValue = getSpreadsheetValueAtPath(row.data, sourceField)
      const sourceTokens = collectSpreadsheetReferenceTokens(rawValue)
      if (!sourceTokens.length) continue

      for (const sourceValue of sourceTokens) {
        const resolution = resolutions.find(entry => entry.sourceValue === sourceValue)
        if (!resolution) continue

        if (resolution.selectedValue !== undefined) {
          if (Array.isArray(rawValue)) {
            const values = multiValueOutputs.get(resolution.outputField) ?? []
            multiValueOutputs.set(resolution.outputField, [...values, resolution.selectedValue])
          }
          else {
            setSpreadsheetValueAtPath(data, resolution.outputField, resolution.selectedValue)
          }
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
    }

    for (const [outputField, values] of multiValueOutputs.entries())
      setSpreadsheetValueAtPath(data, outputField, values)

    for (const relation of params.relations ?? []) {
      if (!isSpreadsheetRelationDefinition(relation)) continue
      if (relation.condition && !relation.condition(data)) continue

      const relationIssues = executeSpreadsheetRules({
        value: getSpreadsheetValueAtPath(data, relation.column),
        rules: resolveSpreadsheetRelationRules({
          row: data,
          rules: relation.rules,
        }),
      })

      issues.push(...relationIssues.map((issue: {
        ruleKey?: string
        level: 'error' | 'warning' | 'info'
        code: string
        message: string
      }) => ({
        ...issue,
        rowIndex: row.index,
        columnKey: relation.column,
      })))
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
    context: params.context,
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
