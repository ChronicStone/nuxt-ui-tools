import { createApp, effectScope, ref } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import type {
  ExtractSpreadsheetRow,
  SpreadsheetImportApi,
} from '#ui-tools/spreadsheet/types'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

function createWorkbookBinary() {
  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet([
    ['Exam name', 'First name'],
    ['Business English 4 Skills', 'John'],
  ])

  utils.book_append_sheet(workbook, sheet, 'Assessments')

  return write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })
}

describe('useSpreadsheetImport', () => {
  it('infers row and submit payload types from the schema without user-land generics', async () => {
    const schema = defineSpreadsheetSchema({
      importKey: 'assessment.results',
      columns: {
        static: (column) => [
          column.text('examNameRaw', {
            rules: v => [v.required()],
            match: {
              headers: ['Exam name'],
            },
          }),
          column.text('firstName', {
            rules: v => [v.required()],
            match: {
              headers: ['First name'],
            },
          }),
        ],
      },
    })

    const app = createApp({})
    app.use(VueQueryPlugin, {
      queryClient: new QueryClient(),
    })

    const scope = effectScope()
    const api = app.runWithContext(() =>
      scope.run(() => useSpreadsheetImport(schema)),
    )
    if (!api) throw new Error('Failed to create spreadsheet import api')

    api.loadSource({
      source: createWorkbookBinary(),
      fileName: 'assessments.xlsx',
    })

    await api.refresh()

    type Row = ExtractSpreadsheetRow<typeof schema>

    expectTypeOf(api).toMatchTypeOf<SpreadsheetImportApi<typeof schema>>()
    expectTypeOf<Row['examNameRaw']>().toEqualTypeOf<string>()
    expect(api.headers.value).toEqual(['Exam name', 'First name'])
    expect(api.rowData.value[0]).toMatchObject({
      examNameRaw: 'Business English 4 Skills',
      firstName: 'John',
    })

    scope.stop()
  })

  it('supports reactive schema sources without explicit generics', () => {
    const schema = ref(defineSpreadsheetSchema({
      importKey: 'demo.import',
    }))

    const app = createApp({})
    app.use(VueQueryPlugin, {
      queryClient: new QueryClient(),
    })

    const scope = effectScope()
    const api = app.runWithContext(() =>
      scope.run(() => useSpreadsheetImport(schema)),
    )
    if (!api) throw new Error('Failed to create spreadsheet import api')

    expect(api.schema.value.importKey).toBe('demo.import')
    scope.stop()
  })
})
