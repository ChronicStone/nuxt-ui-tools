import type { SpreadsheetResolvedOption } from './options'
import type { SpreadsheetRowMode } from './schema'
import type { SpreadsheetIssueLevel, SpreadsheetRecord } from './shared'

/**
 * An issue on a row. `field` is the path of the cell it is about, or `null` for the row.
 *
 * Codes raised by the engine: `required`, `number`, `date`, `boolean`, `parse`, `value.unknown`
 * (a question to answer), `value.not-found`, `value.skipped`, `row.duplicate`, `row.exists`, and
 * `server` (refused on submit). Rules use their name; `validate` issues use their `code`.
 */
export interface SpreadsheetRowIssue {
  field: string | null
  code: string
  level: SpreadsheetIssueLevel
  message: string
}

/**
 * Why a row is left out: discarded by the user (`manual`), by a value answered “skip these rows”
 * (`value`), past `file.maxRows` (`limit`), a duplicate kept elsewhere (`duplicate`), or a stored
 * record left as it is (`existing`).
 */
export type SpreadsheetDiscardReason = 'manual' | 'value' | 'limit' | 'duplicate' | 'existing'

/** State of a row from its most severe issue; `discarded` rows are left out whatever their issues. */
export type SpreadsheetRowStatus = 'valid' | 'warning' | 'blocking' | 'discarded'

export interface SpreadsheetRow<TRow = SpreadsheetRecord, TExisting = unknown> {
  /** 0-based index among the data rows. */
  index: number
  /** Row number in the file. */
  rowNumber: number
  data: TRow
  issues: readonly SpreadsheetRowIssue[]
  errors: readonly SpreadsheetRowIssue[]
  warnings: readonly SpreadsheetRowIssue[]
  /** Most severe issue of each field. */
  fieldIssues: Readonly<Record<string, SpreadsheetRowIssue>>
  status: SpreadsheetRowStatus
  discardReason: SpreadsheetDiscardReason | null
  /** `create` for a new record, `update` or `skip` when the key matches a stored one. */
  mode: SpreadsheetRowMode
  /** The stored record the row's key matches. */
  existing: TExisting | undefined
  /** Fields whose value differs from the stored record. */
  changed: readonly string[]
  /** Fields edited in review. */
  edited: readonly string[]
  /** Valid and not discarded: part of the import. */
  importable: boolean
}

/** A cell as the table shows it. */
export interface SpreadsheetCellView {
  /** Current text, edits included. */
  text: string
  /** Text in the file. */
  original: string
  /** Text to display: the option label for a select, several items joined. */
  display: string
  edited: boolean
  /** Filled by the column's `default`. */
  defaulted: boolean
  /** Holds a value created on import. */
  created: boolean
  issue: SpreadsheetRowIssue | null
  /** Value of the stored record, when it differs. */
  stored: string | null
  /** Options of a select cell for its row. Empty for other cells. */
  choices: readonly SpreadsheetResolvedOption[]
}
