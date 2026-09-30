import type {
  SpreadsheetColumnKind,
  SpreadsheetHeaderMatcher,
  SpreadsheetUnknownPolicy,
} from './columns'
import type {
  SpreadsheetOptionItem,
  SpreadsheetOptionsCreate,
  SpreadsheetOptionsSource,
} from './options'
import type { SpreadsheetCell, SpreadsheetRecord } from './shared'
import type { SpreadsheetRule } from './validation'

/** A group of fields, resolved for the current context. */
export interface SpreadsheetFieldGroup {
  /** Path of the group in the row. */
  path: string
  label: string
  description: string
  /** Its columns are built from the context. */
  dynamic: boolean
}

/**
 * A column of the schema, resolved for the current context: groups flattened, `when` applied,
 * texts and rules resolved.
 */
export interface SpreadsheetField {
  /** Path in the row, like `secureCode` or `levels.general`. */
  path: string
  kind: SpreadsheetColumnKind
  label: string
  /** Name of the column in files: the first declared header, or the label. */
  name: string
  description: string
  example: string
  group: SpreadsheetFieldGroup | null
  /** Names the column matches, the label and the key included. */
  headers: readonly SpreadsheetHeaderMatcher[]
  required: boolean
  /** Default value of a row: the declared value, or the result of `default({ ctx, row })`. */
  defaultOf: ((row: SpreadsheetRecord) => unknown) | null
  hasDefault: boolean
  /** Rules of a row; rules reading the row are resolved for each row. */
  rulesOf: (row: SpreadsheetRecord) => readonly SpreadsheetRule<unknown>[]
  /** The rules do not read the row. */
  staticRules: boolean
  editable: boolean
  /** Item separator with `multiple`, or `null`. */
  separator: string | null
  parse:
    | ((params: { cell: SpreadsheetCell; ctx: unknown; row: SpreadsheetRecord }) => unknown)
    | null
  decimal: '.' | ','
  formats: readonly string[]
  trueTexts: readonly string[]
  falseTexts: readonly string[]
  /** `select` columns only. */
  select: {
    source: SpreadsheetOptionsSource<unknown, SpreadsheetOptionItem, unknown>
    create: SpreadsheetOptionsCreate<unknown, SpreadsheetOptionItem> | null
    /** Path of the field whose cell the select reads, or `null` for its own column. */
    from: string | null
    unknown: SpreadsheetUnknownPolicy
    /** Options that depend on the row: resolved per row, for the fields they read. */
    rowOptions: {
      resolve: (row: SpreadsheetRecord) => readonly SpreadsheetOptionItem[]
      /** Field paths the options read. */
      dependsOn: readonly string[]
    } | null
  } | null
}
