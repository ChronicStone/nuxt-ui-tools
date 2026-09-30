import { read, utils } from 'xlsx'
import type { CellObject, WorkSheet } from 'xlsx'

import type { SpreadsheetFileSource, SpreadsheetSheet, SpreadsheetWorkbook } from '../types'

const TEXT_EXTENSIONS = /\.(?:csv|tsv|txt)$/iu

async function toBytes(source: SpreadsheetFileSource) {
  if (source instanceof Uint8Array) return source
  if (source instanceof ArrayBuffer) return new Uint8Array(source)
  return new Uint8Array(await source.arrayBuffer())
}

function decodeText(bytes: Uint8Array) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/u, '')
  } catch {
    // Excel saves CSV files in the Windows code page in French locales.
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

function detectSeparator(text: string) {
  const firstLine = text.slice(0, text.search(/\r?\n/u) + 1 || text.length)
  const counts = ['\t', ';', ','].map((separator) => ({
    count: firstLine.split(separator).length - 1,
    separator,
  }))
  return counts.reduce((best, entry) => (entry.count > best.count ? entry : best)).separator
}

/** Splits delimited text (CSV, TSV, or rows pasted from a spreadsheet) into rows of cells. */
export function parseSpreadsheetDelimitedText(text: string, separator = detectSeparator(text)) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"' && cell === '') quoted = true
    else if (char === separator) {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function toSheet(
  name: string,
  cells: readonly (readonly string[])[],
  raws?: readonly (readonly unknown[] | undefined)[],
): SpreadsheetSheet {
  const rows: string[][] = []
  const keptRaws: (readonly unknown[] | undefined)[] = []
  const rowNumbers: number[] = []
  for (const [index, row] of cells.entries()) {
    const texts = row.map((value) => value.trim())
    if (!texts.some(Boolean)) continue
    rows.push(texts)
    keptRaws.push(raws?.[index])
    rowNumbers.push(index + 1)
  }
  return { name, raws: keptRaws, rowNumbers, rows }
}

function cellText(cell: CellObject | undefined) {
  if (!cell || cell.v === undefined || cell.v === null) return ''
  return cell.w ?? String(cell.v)
}

function cellRaw(cell: CellObject | undefined) {
  if (!cell) return undefined
  if (cell.t === 'n' || cell.t === 'b' || cell.t === 'd') return cell.v
  return undefined
}

function readSheet(name: string, sheet: WorkSheet | undefined): SpreadsheetSheet {
  const reference = sheet?.['!ref']
  if (!sheet || !reference) return { name, raws: [], rowNumbers: [], rows: [] }
  const range = utils.decode_range(reference)
  const cells: string[][] = []
  const raws: (unknown[] | undefined)[] = []
  for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex += 1) {
    const texts: string[] = []
    let typed: unknown[] | undefined
    for (let columnIndex = 0; columnIndex <= range.e.c; columnIndex += 1) {
      const cell: CellObject | undefined = sheet[utils.encode_cell({ c: columnIndex, r: rowIndex })]
      texts.push(cellText(cell))
      const raw = cellRaw(cell)
      if (raw !== undefined) {
        typed ??= []
        typed[columnIndex] = raw
      }
    }
    cells.push(texts)
    raws.push(typed)
  }
  return toSheet(name, cells, raws)
}

/** Reads an Excel or CSV file. CSV files may use commas, semicolons, or tabs, in UTF-8 or Windows-1252. */
export async function readSpreadsheetFile(params: {
  source: SpreadsheetFileSource
  name: string
}): Promise<SpreadsheetWorkbook> {
  const bytes = await toBytes(params.source)
  if (TEXT_EXTENSIONS.test(params.name))
    return readSpreadsheetText({ name: params.name, text: decodeText(bytes) })
  const workbook = read(bytes, { cellDates: true, type: 'array' })
  return {
    name: params.name,
    sheets: workbook.SheetNames.map((sheetName) =>
      readSheet(sheetName, workbook.Sheets[sheetName]),
    ),
  }
}

/** Reads text pasted from a spreadsheet, or the content of a CSV file. */
export function readSpreadsheetText(params: { text: string; name: string }): SpreadsheetWorkbook {
  return {
    name: params.name,
    sheets: [
      toSheet(
        params.name.replace(/\.[^.]+$/u, '') || 'Sheet 1',
        parseSpreadsheetDelimitedText(params.text),
      ),
    ],
  }
}
