const DELIMITERS = [',', ';', '\t', '|'] as const

type CsvDelimiter = (typeof DELIMITERS)[number]

/** Picks the delimiter that splits the first line into the most cells, outside quotes. */
export function detectCsvDelimiter(text: string): CsvDelimiter {
  const counts = new Map<string, number>()
  let quoted = false
  for (const char of text) {
    if (char === '\n') break
    if (char === '"') quoted = !quoted
    else if (!quoted) counts.set(char, (counts.get(char) ?? 0) + 1)
  }
  return DELIMITERS.reduce((best, delimiter) =>
    (counts.get(delimiter) ?? 0) > (counts.get(best) ?? 0) ? delimiter : best,
  )
}

/**
 * Parses RFC 4180 CSV: quoted cells, doubled quotes, and line breaks inside quotes. Stops after
 * `maxRows` rows so a large export stays cheap to show.
 */
export function parseCsv(input: string, options: { delimiter?: string; maxRows?: number } = {}) {
  const text = input.replace(/^﻿/u, '')
  const delimiter = options.delimiter ?? detectCsvDelimiter(text)
  const maxRows = options.maxRows ?? Infinity
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let complete = true

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char !== '"') cell += char
      else if (text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else quoted = false
      continue
    }
    if (char === '"') quoted = true
    else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (rows.length >= maxRows) {
        complete = index >= text.length - 1
        break
      }
    } else if (char !== '\r') cell += char
  }
  if (complete && (cell !== '' || row.length > 0)) {
    row.push(cell)
    rows.push(row)
  }

  return { complete, delimiter, rows }
}
