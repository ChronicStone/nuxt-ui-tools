import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { UiToolsTranslator } from '#ui-tools/i18n'

import { createSpreadsheetColumnsBuilder } from '../schema/builder'
import type { SpreadsheetRuntimeSchema } from '../types'
import { resolveSpreadsheetFields } from '../utils'
import type { useSpreadsheetContext } from './use-spreadsheet-context'

export interface UseSpreadsheetFieldsParams {
  schema: ComputedRef<SpreadsheetRuntimeSchema>
  context: ReturnType<typeof useSpreadsheetContext>
  t: UiToolsTranslator
}

/** The schema's columns resolved for the current context, once the context is loaded. */
export function useSpreadsheetFields(params: UseSpreadsheetFieldsParams) {
  const builder = createSpreadsheetColumnsBuilder<never>()
  const entries = computed(() => params.schema.value.columns(builder)['~entries'])
  const resolved = computed(() => {
    if (!params.context.ready.value) return { fields: [], groups: [] }
    return resolveSpreadsheetFields({
      ctx: params.context.ctx.value,
      entries: entries.value,
      t: params.t,
    })
  })
  const fields = computed(() => resolved.value.fields)
  const groups = computed(() => resolved.value.groups)
  const byPath = computed(() => new Map(fields.value.map((field) => [field.path, field])))
  /** Fields reading a column of their own. */
  const columnFields = computed(() => fields.value.filter((field) => !field.select?.from))

  return { byPath, columnFields, fields, groups }
}
