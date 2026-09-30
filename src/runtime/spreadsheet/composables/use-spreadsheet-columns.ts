import { computed, shallowRef, watch } from 'vue'

import type { SpreadsheetFieldState } from '../types'
import { matchSpreadsheetHeaders } from '../utils'
import type { useSpreadsheetContext } from './use-spreadsheet-context'
import type { useSpreadsheetFields } from './use-spreadsheet-fields'
import type { useSpreadsheetLayout } from './use-spreadsheet-layout'

export interface UseSpreadsheetColumnsParams {
  fields: ReturnType<typeof useSpreadsheetFields>
  layout: ReturnType<typeof useSpreadsheetLayout>
  context: ReturnType<typeof useSpreadsheetContext>
}

/**
 * Which column each field reads. Headers name fields exactly; the user can choose another column
 * or none. Choices are kept while the header texts stay the same.
 */
export function useSpreadsheetColumns(params: UseSpreadsheetColumnsParams) {
  const manual = shallowRef<Readonly<Record<string, number | null>>>({})
  const headerSignature = computed(() =>
    params.layout.headers.value.map((header) => header.normalized).join('|'),
  )
  watch(headerSignature, () => {
    manual.value = {}
  })

  const matches = computed(() =>
    matchSpreadsheetHeaders({
      ctx: params.context.ctx.value,
      fields: params.fields.columnFields.value,
      headers: params.layout.headers.value,
      manual: manual.value,
    }),
  )

  function samplesOf(column: number) {
    const values: string[] = []
    for (const row of params.layout.dataRows.value) {
      const text = String(row[column] ?? '').trim()
      if (text && !values.includes(text)) values.push(text)
      if (values.length === 3) break
    }
    return values
  }

  const states = computed(() =>
    params.fields.fields.value.map<SpreadsheetFieldState>((field) => {
      const from = field.select?.from ?? null
      const column = from ? matches.value.get(from) : matches.value.get(field.path)
      const header = column === undefined ? null : (params.layout.headers.value[column] ?? null)
      const status =
        header !== null
          ? 'matched'
          : field.hasDefault
            ? 'default'
            : field.required
              ? 'missing'
              : 'unmatched'
      return {
        assignedBy: header === null ? null : field.path in manual.value ? 'user' : 'file',
        description: field.description,
        example: field.example,
        from,
        group: field.group,
        header,
        kind: field.kind,
        label: field.label,
        name: field.name,
        path: field.path,
        required: field.required,
        samples: column === undefined ? [] : samplesOf(column),
        status,
        suggestion: null,
      }
    }),
  )

  const unusedHeaders = computed(() => {
    const used = new Set(matches.value.values())
    return params.layout.headers.value.filter((header) => header.text && !used.has(header.index))
  })

  function assign(field: string, header: number) {
    const next: Record<string, number | null> = {}
    for (const [path, index] of Object.entries(manual.value))
      if (index !== header) next[path] = index
    next[field] = header
    manual.value = next
  }

  function ignore(field: string) {
    manual.value = { ...manual.value, [field]: null }
  }

  function reset(field: string) {
    manual.value = Object.fromEntries(
      Object.entries(manual.value).filter(([path]) => path !== field),
    )
  }

  function clear() {
    manual.value = {}
  }

  return { assign, clear, ignore, manual, matches, reset, states, unusedHeaders }
}
