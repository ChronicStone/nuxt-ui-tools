import { utils, write } from 'xlsx'

import type { SpreadsheetField, SpreadsheetFieldOptions, SpreadsheetRowIssue } from '../types'

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function toBlob(sheets: readonly { name: string; rows: readonly (readonly unknown[])[] }[]) {
  const workbook = utils.book_new()
  for (const sheet of sheets)
    utils.book_append_sheet(
      workbook,
      utils.aoa_to_sheet(sheet.rows.map((row) => [...row])),
      sheet.name.slice(0, 31),
    )
  const binary: ArrayBuffer = write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([binary], { type: XLSX_TYPE })
}

/**
 * The rows as they are in the file, edits included, with an extra column listing their issues, so
 * they can be fixed and imported again.
 */
export function createSpreadsheetIssuesWorkbook(params: {
  headers: readonly string[]
  rows: readonly { cells: readonly string[]; issues: readonly SpreadsheetRowIssue[] }[]
  issuesHeader: string
  labels: ReadonlyMap<string, string>
}) {
  return toBlob([
    {
      name: 'Rows',
      rows: [
        [...params.headers, params.issuesHeader],
        ...params.rows.map((row) => [
          ...row.cells,
          row.issues
            .map((issue) =>
              issue.field
                ? `${params.labels.get(issue.field) ?? issue.field}: ${issue.message}`
                : issue.message,
            )
            .join('\n'),
        ]),
      ],
    },
  ])
}

/**
 * The file to fill in: one column per field that reads its own column, named by its first declared
 * header, and a sheet describing each column and its allowed values.
 */
export function createSpreadsheetTemplateWorkbook(params: {
  fields: readonly SpreadsheetField[]
  options: ReadonlyMap<string, SpreadsheetFieldOptions>
  sheetName: string
  guideName: string
  guideHeaders: readonly [column: string, required: string, allowed: string, description: string]
  yes: string
}) {
  const fields = params.fields.filter((field) => !field.select?.from)
  return toBlob([
    {
      name: params.sheetName,
      rows: [fields.map((field) => field.name), fields.map((field) => field.example)],
    },
    {
      name: params.guideName,
      rows: [
        [...params.guideHeaders],
        ...fields.map((field) => [
          field.name,
          field.required ? params.yes : '',
          (params.options.get(field.path)?.options ?? [])
            .slice(0, 50)
            .map((option) => option.label)
            .join(', '),
          field.description,
        ]),
      ],
    },
  ])
}
