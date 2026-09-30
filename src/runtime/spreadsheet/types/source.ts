/** One sheet of a file: displayed text of each non-empty row, typed cell values, row numbers. */
export interface SpreadsheetSheet {
  name: string
  /** Text of each cell as displayed in the file, trimmed. Empty rows are left out. */
  rows: readonly (readonly string[])[]
  /** Typed values (number, boolean, `Date`) of each row, where the file stores one. */
  raws: readonly (readonly unknown[] | undefined)[]
  /** Row number in the file (1-based) of each row. */
  rowNumbers: readonly number[]
}

export interface SpreadsheetWorkbook {
  name: string
  sheets: readonly SpreadsheetSheet[]
}

/** What `importer.file.load` accepts. */
export type SpreadsheetFileSource = File | Blob | ArrayBuffer | Uint8Array

/** A row of a sheet scored as a header row: how many columns of the schema its cells match. */
export interface SpreadsheetHeaderRowCandidate {
  /** 0-based index among the sheet's rows. */
  index: number
  rowNumber: number
  matchCount: number
  /** First non-empty cells of the row. */
  preview: readonly string[]
}

export interface SpreadsheetSheetLayout {
  name: string
  /** Best header row of the sheet. */
  headerRow: number
  matchCount: number
  /** Data rows under the best header row. */
  rowCount: number
  candidates: readonly SpreadsheetHeaderRowCandidate[]
}

export interface SpreadsheetLayoutDetection {
  sheets: readonly SpreadsheetSheetLayout[]
  best: { sheet: string; headerRow: number; matchCount: number } | null
  /** Several sheets match equally well. */
  ambiguous: boolean
}
