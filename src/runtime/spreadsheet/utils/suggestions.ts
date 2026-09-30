import type { UiToolsTranslator } from '#ui-tools/i18n'

import type { SpreadsheetField, SpreadsheetFieldOptions, SpreadsheetHeaderCell } from '../types'
import { parseSpreadsheetRow } from './rows'

/** Share of sample values that must pass before a column is suggested for a field. */
export const SPREADSHEET_SUGGESTION_PASS_RATE = 0.8
const SAMPLE_SIZE = 30

/**
 * For each required field without a column, the first unused column whose sample values all read
 * as the field's type and pass its rules. A suggestion is offered to the user, never applied.
 */
export function suggestSpreadsheetColumns(params: {
  fields: readonly SpreadsheetField[]
  headers: readonly SpreadsheetHeaderCell[]
  rows: readonly (readonly string[])[]
  raws: readonly (readonly unknown[] | undefined)[]
  options: ReadonlyMap<string, SpreadsheetFieldOptions>
  ctx: unknown
  t: UiToolsTranslator
}) {
  const suggestions = new Map<
    string,
    { header: SpreadsheetHeaderCell; samples: readonly string[] }
  >()
  const taken = new Set<number>()
  for (const field of params.fields) {
    // Options and rules reading the row cannot judge a column alone.
    if (field.select?.rowOptions) continue
    const rules = field.staticRules ? field.rulesOf({}) : []
    if (field.kind === 'text' && !rules.length && !field.parse) continue
    for (const header of params.headers) {
      if (taken.has(header.index) || !header.text) continue
      const samples = params.rows
        .map((row, index) => ({ index, text: String(row[header.index] ?? '').trim() }))
        .filter((entry) => entry.text)
        .slice(0, SAMPLE_SIZE)
      if (samples.length < 2) continue
      const passing = samples.filter((sample) => {
        const parsed = parseSpreadsheetRow({
          cells: params.rows[sample.index] ?? [],
          context: {
            answers: {},
            columns: new Map([[field.path, header.index]]),
            ctx: params.ctx,
            fields: [{ ...field, required: false, rulesOf: () => rules }],
            headers: [],
            optionsOf: () => ({ options: params.options.get(field.path), scope: null }),
            t: params.t,
          },
          edits: undefined,
          index: sample.index,
          raws: params.raws[sample.index],
        })
        return !parsed.issues.some((issue) => issue.level === 'error') && !parsed.unmatched.length
      })
      if (passing.length / samples.length < SPREADSHEET_SUGGESTION_PASS_RATE) continue
      suggestions.set(field.path, {
        header,
        samples: [...new Set(samples.map((sample) => sample.text))].slice(0, 3),
      })
      taken.add(header.index)
      break
    }
  }
  return suggestions
}
