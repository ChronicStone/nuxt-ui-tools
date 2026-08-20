import type {
  SpreadsheetParsedRow,
  SpreadsheetReferenceQueryRequest,
  SpreadsheetRelationDefinition,
  SpreadsheetReferenceResolution,
  SpreadsheetRecord,
  SpreadsheetResolvedReferenceRow,
  SpreadsheetRowIssue,
  SpreadsheetValue,
} from '../../types'
import { isFunction, isString } from '#ui-tools/shared/utils/predicate'
import {
  cloneSpreadsheetRowData,
  deleteSpreadsheetValueAtPath,
  getSpreadsheetValueAtPath,
  setSpreadsheetValueAtPath,
  isSpreadsheetRecord,
} from '../object'
import { resolveSpreadsheetOptionEntries } from '../options'
import { executeSpreadsheetRules, resolveSpreadsheetRelationRules } from '../validation/core'
import { createSpreadsheetReferenceCandidates } from './candidates'
import { isSpreadsheetResolutionDefinition, normalizeSpreadsheetRuntimeResolutions } from './guards'
import { collectSpreadsheetReferenceSources, collectSpreadsheetReferenceTokens } from './sources'

function isSpreadsheetRelationDefinition(
  value: SpreadsheetValue,
): value is SpreadsheetRelationDefinition<SpreadsheetRecord> {
  return (
    isSpreadsheetRecord(value) &&
    'column' in value &&
    isString(value.column) &&
    'rules' in value &&
    isFunction(value.rules)
  )
}

export function createSpreadsheetReferenceResolutions(params: {
  references: readonly unknown[]
  rows: readonly SpreadsheetParsedRow<SpreadsheetRecord>[]
  context: SpreadsheetRecord
}) {
  return collectSpreadsheetReferenceSources(params.references, params.rows).flatMap(
    ({ reference, entries }) =>
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
          scope: reference.scope,
          resolutionField: reference.targetField,
          targetField: reference.targetField,
          referenceField: reference.targetField,
          sourceField: reference.sourceField,
          outputField: reference.targetField,
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
  rows: readonly SpreadsheetParsedRow<SpreadsheetRecord>[]
  references: readonly unknown[]
  resolutions: readonly SpreadsheetReferenceResolution[]
  relations?: readonly unknown[]
}) {
  const resolutionDefinitions = normalizeSpreadsheetRuntimeResolutions(params.references)
  const resolutionsBySourceField = params.resolutions.reduce<
    Map<string, SpreadsheetReferenceResolution[]>
  >((groups, resolution) => {
    const entries = groups.get(resolution.sourceField) ?? []
    groups.set(resolution.sourceField, [...entries, resolution])
    return groups
  }, new Map<string, SpreadsheetReferenceResolution[]>())

  return params.rows.map<SpreadsheetResolvedReferenceRow<SpreadsheetRecord>>((row) => {
    const data = cloneSpreadsheetRowData(row.data)
    const issues: SpreadsheetRowIssue[] = [...row.issues]
    const multiValueOutputs = new Map<string, unknown[]>()

    for (const definition of resolutionDefinitions) {
      if (definition.scope !== 'column') continue
      deleteSpreadsheetValueAtPath(data, definition.targetField)
    }

    for (const [sourceField, resolutions] of resolutionsBySourceField.entries()) {
      const rawValue = getSpreadsheetValueAtPath(row.data, sourceField)
      const sourceTokens = collectSpreadsheetReferenceTokens(rawValue)
      if (!sourceTokens.length) continue

      for (const sourceValue of sourceTokens) {
        const resolution = resolutions.find((entry) => entry.sourceValue === sourceValue)
        if (!resolution) continue

        if (resolution.selectedValue !== undefined) {
          if (Array.isArray(rawValue)) {
            const values = multiValueOutputs.get(resolution.outputField) ?? []
            multiValueOutputs.set(resolution.outputField, [...values, resolution.selectedValue])
          } else {
            setSpreadsheetValueAtPath(data, resolution.outputField, resolution.selectedValue)
          }
          continue
        }
      }
    }

    for (const [outputField, values] of multiValueOutputs.entries())
      setSpreadsheetValueAtPath(data, outputField, values)

    for (const reference of resolutionDefinitions) {
      const value = getSpreadsheetValueAtPath(data, reference.targetField)

      const referenceIssues = executeSpreadsheetRules({
        value,
        rules: reference.rules,
      })

      issues.push(
        ...referenceIssues.map(
          (issue: {
            ruleKey?: string
            level: 'error' | 'warning' | 'info'
            code: string
            message: string
          }) => ({
            ...issue,
            rowIndex: row.index,
            columnKey: reference.targetField,
          }),
        ),
      )
    }

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

      issues.push(
        ...relationIssues.map(
          (issue: {
            ruleKey?: string
            level: 'error' | 'warning' | 'info'
            code: string
            message: string
          }) => ({
            ...issue,
            rowIndex: row.index,
            columnKey: relation.column,
          }),
        ),
      )
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
  rows: readonly SpreadsheetParsedRow<SpreadsheetRecord>[]
  context: SpreadsheetRecord
}) {
  return createSpreadsheetReferenceResolutions({
    references: params.references,
    rows: params.rows,
    context: params.context,
  }).flatMap<SpreadsheetReferenceQueryRequest>((resolution) => {
    const referenceEntry = normalizeSpreadsheetRuntimeResolutions(params.references).find(
      (entry) => entry.targetField === (resolution.targetField ?? resolution.referenceField),
    )
    if (!isSpreadsheetResolutionDefinition(referenceEntry)) return []

    const reference = referenceEntry
    if (!reference.getOptions || resolution.status === 'matched') return []

    const sourceRow = params.rows.find((row) => row.index === resolution.rowIndexes[0])
    if (!sourceRow) return []

    return [
      {
        scope: reference.scope,
        resolutionField: reference.targetField,
        targetField: reference.targetField,
        referenceField: reference.targetField,
        sourceValue: resolution.sourceValue,
        query: reference.getOptions({
          context: params.context,
          row: sourceRow.data,
          search: resolution.sourceValue,
        }),
      },
    ]
  })
}
