import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
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
  const secondSheet = utils.aoa_to_sheet([
    ['Value'],
    ['Other'],
  ])

  utils.book_append_sheet(workbook, assessmentSheet, 'Assessments')
  utils.book_append_sheet(workbook, secondSheet, 'Other')

  return write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })
}

describe('spreadsheet source utils', () => {
  it('parses workbook sheets and extracts rows', async () => {
    const workbook = await parseSpreadsheetWorkbook({
      source: createWorkbookBinary(),
      fileName: 'assessments.xlsx',
    })

    expect(workbook.fileName).toBe('assessments.xlsx')
    expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(['Assessments', 'Other'])
    expect(getSpreadsheetSheet(workbook, 'Assessments')?.rows).toHaveLength(3)
    expect(getSpreadsheetHeaders(getSpreadsheetSheet(workbook, 'Assessments'), 0)).toEqual([
      'Exam name',
      'First name',
      'School level: PRÉREQUIS CECR',
    ])
    expect(getSpreadsheetDataRows(getSpreadsheetSheet(workbook, 'Assessments'), 0)).toEqual([
      ['Business English 4 Skills', 'John', 'Primary, Secondary'],
      ['Reading Placement Test', 'Jane', 'Primary'],
    ])
  })

  it('tracks workbook selection through the source composable', async () => {
    const binary = ref(createWorkbookBinary())
    const source = useSpreadsheetSource({
      source: binary,
      fileName: ref('assessments.xlsx'),
    })

    await sourceTick()

    expect(source.workbook.value?.sheets).toHaveLength(2)
    expect(source.headers.value).toEqual([
      'Exam name',
      'First name',
      'School level: PRÉREQUIS CECR',
    ])
    expect(source.rows.value).toEqual([
      ['Business English 4 Skills', 'John', 'Primary, Secondary'],
      ['Reading Placement Test', 'Jane', 'Primary'],
    ])

    source.setSheetName('Other')
    expect(source.headers.value).toEqual(['Value'])

    source.setHeaderRowIndex(1)
    expect(source.headers.value).toEqual(['Other'])
    expect(source.rows.value).toEqual([])
  })
})

async function sourceTick() {
  await Promise.resolve()
  await Promise.resolve()
}
