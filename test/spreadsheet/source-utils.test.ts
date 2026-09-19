import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { utils, write } from 'xlsx'

import {
  getSpreadsheetDataRows,
  getSpreadsheetHeaders,
  getSpreadsheetSheet,
  parseSpreadsheetWorkbook,
} from '#ui-tools/spreadsheet'

import { useSpreadsheetSource } from '../../src/runtime/spreadsheet/composables/use-spreadsheet-source'

function createWorkbookBinary() {
  const workbook = utils.book_new()
  const assessmentSheet = utils.aoa_to_sheet([
    ['Exam name', 'First name', 'School level: PRÉREQUIS CECR'],
    ['Business English 4 Skills', 'John', 'Primary, Secondary'],
    ['Reading Placement Test', 'Jane', 'Primary'],
  ])
  const secondSheet = utils.aoa_to_sheet([['Value'], ['Other']])

  utils.book_append_sheet(workbook, assessmentSheet, 'Assessments')
  utils.book_append_sheet(workbook, secondSheet, 'Other')

  return write(workbook, {
    bookType: 'xlsx',
    type: 'buffer',
  })
}

describe('spreadsheet source utils', () => {
  it('parses workbook sheets and extracts rows', async () => {
    const workbook = await parseSpreadsheetWorkbook({
      fileName: 'assessments.xlsx',
      source: createWorkbookBinary(),
    })

    expect(workbook.fileName).toBe('assessments.xlsx')
    expect(workbook.sheets.map((sheet) => sheet.name)).toStrictEqual(['Assessments', 'Other'])
    expect(getSpreadsheetSheet(workbook, 'Assessments')?.rows).toHaveLength(3)
    expect(getSpreadsheetHeaders(getSpreadsheetSheet(workbook, 'Assessments'), 0)).toStrictEqual([
      'Exam name',
      'First name',
      'School level: PRÉREQUIS CECR',
    ])
    expect(getSpreadsheetDataRows(getSpreadsheetSheet(workbook, 'Assessments'), 0)).toStrictEqual([
      ['Business English 4 Skills', 'John', 'Primary, Secondary'],
      ['Reading Placement Test', 'Jane', 'Primary'],
    ])
  })

  it('tracks workbook selection through the source composable', async () => {
    const binary = ref(createWorkbookBinary())
    const source = useSpreadsheetSource({
      fileName: ref('assessments.xlsx'),
      source: binary,
    })

    await sourceTick()

    expect(source.workbook.value?.sheets).toHaveLength(2)
    expect(source.headers.value).toStrictEqual([
      'Exam name',
      'First name',
      'School level: PRÉREQUIS CECR',
    ])
    expect(source.rows.value).toStrictEqual([
      ['Business English 4 Skills', 'John', 'Primary, Secondary'],
      ['Reading Placement Test', 'Jane', 'Primary'],
    ])

    source.setSheetName('Other')
    expect(source.headers.value).toStrictEqual(['Value'])

    source.setHeaderRowIndex(1)
    expect(source.headers.value).toStrictEqual(['Other'])
    expect(source.rows.value).toStrictEqual([])
  })
})

async function sourceTick() {
  await Promise.resolve()
  await Promise.resolve()
}
