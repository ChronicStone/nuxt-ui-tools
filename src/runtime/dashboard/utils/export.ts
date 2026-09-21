import { isNumber } from '../../shared/utils/predicate'
import type { DashboardDataCell, DashboardDataTable } from '../types'

/** A table cell from a raw value and, optionally, its display text (defaults to the value). */
export function toDashboardCell(
  value: string | number | null | undefined,
  text?: string,
): DashboardDataCell {
  return {
    text: text ?? (value === null || value === undefined ? '' : String(value)),
    value: value ?? null,
  }
}

const decimalByLocale = new Map<string, string>()

function decimalSeparator(locale: string) {
  let separator = decimalByLocale.get(locale)
  if (separator === undefined) {
    separator =
      new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === 'decimal')
        ?.value ?? '.'
    decimalByLocale.set(locale, separator)
  }
  return separator
}

/**
 * Serializes a data table to CSV the way spreadsheet apps of the locale read it: numbers are raw
 * (not formatted) with the locale decimal mark, and locales whose decimal mark is a comma use `;`
 * between fields. Every text field is quoted.
 */
export function toDashboardCsv(table: DashboardDataTable, locale: string): string {
  const decimal = decimalSeparator(locale)
  const delimiter = decimal === ',' ? ';' : ','
  const field = (cell: DashboardDataCell) => {
    if (cell.value === null) return ''
    if (isNumber(cell.value)) return String(cell.value).replace('.', decimal)
    return quote(cell.value)
  }
  const lines = [
    table.columns.map((column) => quote(column.label)).join(delimiter),
    ...table.rows.map((row) => row.map(field).join(delimiter)),
  ]
  return lines.join('\r\n')
}

function quote(text: string) {
  return `"${text.replaceAll('"', '""')}"`
}

/** File name from a card title: `Consommation mensuelle` → `consommation-mensuelle.csv`. */
export function resolveDashboardFileName(title: string, extension: string) {
  const slug = title
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
  return `${slug || 'dashboard'}.${extension}`
}

/** Downloads text as a file. The BOM lets spreadsheet apps detect UTF-8 (accents, `€`). */
export function downloadDashboardFile(name: string, content: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob(['﻿', content], { type: `${type};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  // Some browsers read the URL after `click()` returns.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
