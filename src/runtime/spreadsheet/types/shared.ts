import type { GenericObject } from '#ui-tools/shared/types/utils'

/** Runtime value read from a cell, a row, or the context. */
export type SpreadsheetValue = GenericObject[string]

/** Row or context data decoded at runtime. */
// oxlint-disable-next-line typescript/consistent-type-definitions -- a type alias keeps the implicit index signature rows rely on
export type SpreadsheetRecord = {
  [key: string]: SpreadsheetValue
}

/** Severity of an issue: only `error` keeps a row out of the import. */
export type SpreadsheetIssueLevel = 'info' | 'warning' | 'error'

/** One cell as a column parser receives it. */
export interface SpreadsheetCell {
  /** Text as displayed in the file, trimmed. Edits made in review replace it. */
  text: string
  /** Typed value when the file stores one (number, boolean, date), otherwise the text. */
  raw: unknown
  /** Header of the column the cell comes from, or an empty string without a column. */
  header: string
  /** 0-based index of the data row. */
  rowIndex: number
}

/** A header cell of the selected sheet. */
export interface SpreadsheetHeaderCell {
  /** 0-based column index in the sheet. */
  index: number
  text: string
  /** Text used for exact matching: no case, accents, or repeated spaces. */
  normalized: string
}

/** Removes `readonly` from arrays and flattens intersections, for readable inferred types. */
export type SpreadsheetPrettify<T> = { [K in keyof T]: T[K] } & NonNullable<unknown>

export type SpreadsheetUnionToIntersection<U> = (
  U extends unknown ? (value: U) => void : never
) extends (value: infer I) => void
  ? I
  : never
