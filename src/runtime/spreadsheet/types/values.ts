import type { SpreadsheetUnknownPolicy } from './columns'
import type { SpreadsheetResolvedOption } from './options'

/** An answer to a value that is not an option; it applies to every row with the value. */
export type SpreadsheetValueAnswer =
  | { action: 'map'; value: unknown; label: string }
  | { action: 'leave-empty' }
  | { action: 'skip-rows' }
  | { action: 'create' }

/** Answers by field path, then by answer key (see `SpreadsheetValueQuestion['key']`). */
export type SpreadsheetValueAnswers = Readonly<
  Record<string, Readonly<Record<string, SpreadsheetValueAnswer>>>
>

/** A field whose value decides the options, with its values in the rows of a question. */
export interface SpreadsheetValueScopeField {
  field: string
  label: string
  /** Distinct values, as displayed. */
  values: readonly string[]
}

/**
 * The set of options a value was checked against, when a column's options depend on the row
 * (`options: ({ row }) => …`). The same value is asked once per set of options.
 */
export interface SpreadsheetValueScope {
  id: string
  /** Fields the options read, with their values in the question's rows: `Product: English`. */
  dependsOn: readonly SpreadsheetValueScopeField[]
}

/** One distinct value of a select column that matches no option. */
export interface SpreadsheetValueQuestion<TPath extends string = string> {
  /** `field::key` */
  id: string
  field: TPath
  fieldLabel: string
  /** Value as written in the file (first occurrence). */
  value: string
  /** The answer key: the normalized value, prefixed by the scope id when there is a scope. */
  key: string
  /** Set of options the value was checked against, when they depend on the row. */
  scope: SpreadsheetValueScope | null
  /** Options the value can map to. Empty for a remote list: search it. */
  choices: readonly SpreadsheetResolvedOption[]
  /** Header of the column the value comes from. */
  header: string
  /** Indexes of the rows using the value. */
  rows: readonly number[]
  state: 'open' | 'answered'
  answer: SpreadsheetValueAnswer | null
  /** `policy` when the column's `unknown` policy answered. */
  answeredBy: 'user' | 'policy' | null
  policy: SpreadsheetUnknownPolicy
  /** The column can create new values. */
  canCreate: boolean
  /** Choices come from a remote search rather than a list. */
  remote: boolean
}

/** A distinct value of a select column that matched an option. */
export interface SpreadsheetRecognizedValue<TPath extends string = string> {
  field: TPath
  value: string
  /** Id of the set of options, when they depend on the row. */
  scope: string | null
  option: SpreadsheetResolvedOption
  rows: readonly number[]
}

/** Options of a select field, resolved and indexed for exact matching. */
export interface SpreadsheetFieldOptions {
  status: 'loading' | 'ready' | 'error'
  options: readonly SpreadsheetResolvedOption[]
  index: ReadonlyMap<string, SpreadsheetResolvedOption>
  remote: boolean
  error: unknown
}
