import { isFunction, isString } from '#ui-tools/shared/utils/predicate'

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
          options: resolveSpreadsheetOptionEntries(reference.options, {
            context: params.context,
          }),
          reference,
          sourceValue: entry.value,
        })
        const bestCandidate = candidates[0]
        const isMatched = Boolean(bestCandidate && bestCandidate.score >= 0.9)

        return {
          candidates,
          outputField: reference.targetField,
          referenceField: reference.targetField,
          resolutionField: reference.targetField,
          rowIndexes: entry.rowIndexes,
          scope: reference.scope,
          selectedLabel: isMatched ? bestCandidate?.label : undefined,
          selectedValue: isMatched ? bestCandidate?.value : undefined,
          sourceField: reference.sourceField,
          sourceValue: entry.value,
          status: isMatched ? 'matched' : 'unresolved',
          targetField: reference.targetField,
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
      if (definition.scope !== 'column') {
        continue
      }
      deleteSpreadsheetValueAtPath(data, definition.targetField)
    }

    for (const [sourceField, resolutions] of resolutionsBySourceField.entries()) {
      const rawValue = getSpreadsheetValueAtPath(row.data, sourceField)
      const sourceTokens = collectSpreadsheetReferenceTokens(rawValue)
      if (!sourceTokens.length) {
        continue
      }

      for (const sourceValue of sourceTokens) {
        const resolution = resolutions.find((entry) => entry.sourceValue === sourceValue)
        if (!resolution) {
          continue
        }

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

    for (const [outputField, values] of multiValueOutputs.entries()) {
      setSpreadsheetValueAtPath(data, outputField, values)
    }

    for (const reference of resolutionDefinitions) {
      const value = getSpreadsheetValueAtPath(data, reference.targetField)

      const referenceIssues = executeSpreadsheetRules({
        rules: reference.rules,
        value,
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
            columnKey: reference.targetField,
            rowIndex: row.index,
          }),
        ),
      )
    }

    for (const relation of params.relations ?? []) {
      if (!isSpreadsheetRelationDefinition(relation)) {
        continue
      }
      if (relation.condition && !relation.condition(data)) {
        continue
      }

      const relationIssues = executeSpreadsheetRules({
        rules: resolveSpreadsheetRelationRules({
          row: data,
          rules: relation.rules,
        }),
        value: getSpreadsheetValueAtPath(data, relation.column),
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
            columnKey: relation.column,
            rowIndex: row.index,
          }),
        ),
      )
    }

    return {
      data,
      index: row.index,
      isValid: issues.every((issue) => issue.level !== 'error'),
      issues,
      source: row.source,
    }
  })
}

export function createSpreadsheetReferenceQueryRequests(params: {
  references: readonly unknown[]
  rows: readonly SpreadsheetParsedRow<SpreadsheetRecord>[]
  context: SpreadsheetRecord
}) {
  return createSpreadsheetReferenceResolutions({
    context: params.context,
    references: params.references,
    rows: params.rows,
  }).flatMap<SpreadsheetReferenceQueryRequest>((resolution) => {
    const referenceEntry = normalizeSpreadsheetRuntimeResolutions(params.references).find(
      (entry) => entry.targetField === (resolution.targetField ?? resolution.referenceField),
    )
    if (!isSpreadsheetResolutionDefinition(referenceEntry)) {
      return []
    }

    const reference = referenceEntry
    if (!reference.getOptions || resolution.status === 'matched') {
      return []
    }

    const sourceRow = params.rows.find((row) => row.index === resolution.rowIndexes[0])
    if (!sourceRow) {
      return []
    }

    return [
      {
        query: reference.getOptions({
          context: params.context,
          row: sourceRow.data,
          search: resolution.sourceValue,
        }),
        referenceField: reference.targetField,
        resolutionField: reference.targetField,
        scope: reference.scope,
        sourceValue: resolution.sourceValue,
        targetField: reference.targetField,
      },
    ]
  })
}
