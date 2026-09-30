import { computed } from 'vue'

import type {
  SpreadsheetField,
  SpreadsheetPrimitiveOption,
  SpreadsheetRecognizedValue,
  SpreadsheetValueAnswer,
  SpreadsheetValueQuestion,
  SpreadsheetValueTarget,
} from '../types'
import { normalizeSpreadsheetText, spreadsheetAnswerKey } from '../utils'
import type { useSpreadsheetAnswers } from './use-spreadsheet-answers'
import type { useSpreadsheetFields } from './use-spreadsheet-fields'
import type { useSpreadsheetOptions } from './use-spreadsheet-options'
import type { useSpreadsheetRows } from './use-spreadsheet-rows'

export interface UseSpreadsheetValuesParams {
  fields: ReturnType<typeof useSpreadsheetFields>
  options: ReturnType<typeof useSpreadsheetOptions>
  answers: ReturnType<typeof useSpreadsheetAnswers>
  rows: ReturnType<typeof useSpreadsheetRows>
}

function isAnswer(
  value: SpreadsheetValueAnswer | SpreadsheetPrimitiveOption,
): value is SpreadsheetValueAnswer {
  return typeof value === 'object' && value !== null && 'action' in value
}

/**
 * Distinct values of select columns that match no option, as questions answered once for every
 * row using them (per set of options, when options depend on the row); and the values that
 * matched, for display.
 */
export function useSpreadsheetValues(params: UseSpreadsheetValuesParams) {
  /** Fields a scope's options read, with their displayed values in the given rows. */
  function scopeOf(field: SpreadsheetField, scope: string, rows: readonly number[]) {
    const dependsOn = (field.select?.rowOptions?.dependsOn ?? []).map((path) => {
      const values = new Set<string>()
      for (const index of rows) {
        const display = params.rows.parsed.value[index]?.cells.get(path)?.display
        if (display) values.add(display)
      }
      return {
        field: path,
        label: params.fields.byPath.value.get(path)?.label ?? path,
        values: [...values],
      }
    })
    return { dependsOn, id: scope }
  }

  const questions = computed(() => {
    const byId = new Map<
      string,
      Omit<SpreadsheetValueQuestion, 'scope'> & { rows: number[]; scopeId: string | null }
    >()
    const answers = params.answers.answers.value
    for (const [index, row] of params.rows.parsed.value.entries()) {
      const reason = params.rows.rows.value[index]?.discardReason
      // Rows left out for another reason than a value answer need no answer.
      if (reason && reason !== 'value') continue
      for (const token of row.unmatched) {
        const key = spreadsheetAnswerKey(token.key, token.scope)
        const id = `${token.field}::${key}`
        const existing = byId.get(id)
        if (existing) {
          existing.rows.push(index)
          continue
        }
        const field = params.fields.byPath.value.get(token.field)
        const select = field?.select
        if (!field || !select) continue
        const userAnswer = answers[token.field]?.[key] ?? null
        const policyAnswer: SpreadsheetValueAnswer | null =
          select.unknown === 'ask' || select.unknown === 'error' ? null : { action: select.unknown }
        const effective = userAnswer ?? policyAnswer
        byId.set(id, {
          answer: effective,
          answeredBy: userAnswer ? 'user' : policyAnswer ? 'policy' : null,
          canCreate: Boolean(select.create),
          choices: row.cells.get(token.field)?.choices ?? [],
          field: token.field,
          fieldLabel: field.group ? `${field.group.label} · ${field.label}` : field.label,
          header: token.header,
          id,
          key,
          policy: select.unknown,
          remote: params.options.options.value.get(token.field)?.remote ?? false,
          rows: [index],
          scopeId: token.scope,
          state: effective ? 'answered' : 'open',
          value: token.value,
        })
      }
    }
    return [...byId.values()]
      .filter((question) => question.policy !== 'error')
      .map(({ scopeId, ...question }): SpreadsheetValueQuestion => {
        const field = params.fields.byPath.value.get(question.field)
        return {
          ...question,
          scope: scopeId && field ? scopeOf(field, scopeId, question.rows) : null,
        }
      })
  })

  const open = computed(() => questions.value.filter((question) => question.state === 'open'))

  const recognized = computed(() => {
    const byId = new Map<string, SpreadsheetRecognizedValue & { rows: number[] }>()
    for (const [index, row] of params.rows.parsed.value.entries()) {
      for (const token of row.matched) {
        const id = `${token.field}::${spreadsheetAnswerKey(token.key, token.scope)}`
        const existing = byId.get(id)
        if (existing) existing.rows.push(index)
        else
          byId.set(id, {
            field: token.field,
            option: token.option,
            rows: [index],
            scope: token.scope,
            value: token.value,
          })
      }
    }
    return [...byId.values()]
  })

  function choices(field: string, row?: number) {
    if (row !== undefined) {
      const cell = params.rows.parsed.value[row]?.cells.get(field)
      if (cell) return cell.choices
    }
    return params.options.options.value.get(field)?.options ?? []
  }

  function keyOf(target: SpreadsheetValueTarget) {
    return spreadsheetAnswerKey(normalizeSpreadsheetText(target.value), target.scope?.id)
  }

  function answer(
    target: SpreadsheetValueTarget,
    choice: SpreadsheetValueAnswer | SpreadsheetPrimitiveOption,
  ) {
    const key = keyOf(target)
    if (isAnswer(choice)) {
      params.answers.set(target.field, key, choice)
      return
    }
    const question = questions.value.find(
      (candidate) => candidate.field === target.field && candidate.key === key,
    )
    const option = (question?.choices ?? choices(target.field)).find(
      (entry) => entry.value === choice,
    )
    params.answers.set(target.field, key, {
      action: 'map',
      label: option?.label ?? String(choice),
      value: choice,
    })
  }

  function clear(target: SpreadsheetValueTarget) {
    params.answers.remove(target.field, keyOf(target))
  }

  return { answer, choices, clear, open, questions, recognized, search: params.options.search }
}
