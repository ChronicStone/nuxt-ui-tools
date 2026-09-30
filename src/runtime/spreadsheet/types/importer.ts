import type { MaybeRefOrGetter } from 'vue'

import type { QueryFnDefinition } from '#ui-tools/shared/types/query'
import type { MaybePromise } from '#ui-tools/shared/types/utils'

import type { SpreadsheetColumnKind } from './columns'
import type { SpreadsheetFieldGroup } from './fields'
import type { SpreadsheetPrimitiveOption, SpreadsheetResolvedOption } from './options'
import type { SpreadsheetCellView, SpreadsheetRow, SpreadsheetRowIssue } from './rows'
import type {
  ExtractSpreadsheetContext,
  ExtractSpreadsheetExisting,
  ExtractSpreadsheetFieldPath,
  ExtractSpreadsheetOutput,
  ExtractSpreadsheetRow,
  SpreadsheetRuntimeSchema,
} from './schema'
import type { SpreadsheetHeaderCell, SpreadsheetIssueLevel } from './shared'
import type {
  SpreadsheetFileSource,
  SpreadsheetHeaderRowCandidate,
  SpreadsheetLayoutDetection,
} from './source'
import type {
  SpreadsheetRecognizedValue,
  SpreadsheetValueAnswer,
  SpreadsheetValueQuestion,
  SpreadsheetValueScope,
} from './values'

/** A context entry: a value, a ref, a getter, or a TanStack query the runtime loads. */
export type SpreadsheetContextEntry<TValue> =
  | MaybeRefOrGetter<TValue>
  | QueryFnDefinition<TValue>
  | (() => QueryFnDefinition<TValue>)

export type SpreadsheetContextInput<TContext> = {
  [TKey in keyof TContext]: SpreadsheetContextEntry<TContext[TKey]>
}

export interface SpreadsheetSubmitRow<TOutput, TExisting> {
  /** Index of the data row. */
  index: number
  mode: 'create' | 'update'
  payload: TOutput
  existing: TExisting | undefined
}

export interface SpreadsheetSubmitParams<TOutput, TExisting, TContext> {
  /** Payloads of new records. */
  create: readonly TOutput[]
  /** Payloads of stored records to update. */
  update: readonly TOutput[]
  /** Every payload with its row, to report rejections by row index. */
  rows: readonly SpreadsheetSubmitRow<TOutput, TExisting>[]
  ctx: TContext
  /** Position of this call when rows are sent in batches. */
  batch: { index: number; count: number }
  /** Reports how many rows of this call are done. */
  reportProgress: (done: number) => void
  signal: AbortSignal
}

export interface SpreadsheetSubmitRejection {
  /** Index of the data row, from `rows[i].index`. */
  index: number
  message: string
  field?: string
}

export interface SpreadsheetSubmitResult {
  /** Rows the server refused: they go back to review with the message. */
  rejected?: readonly SpreadsheetSubmitRejection[]
}

type SpreadsheetContextOption<TContext> = [keyof TContext] extends [never]
  ? { context?: SpreadsheetContextInput<TContext> }
  : { context: SpreadsheetContextInput<TContext> }

export type SpreadsheetImportOptions<TSchema> = SpreadsheetContextOption<
  ExtractSpreadsheetContext<TSchema>
> & {
  /** Imports the rows. Return `{ rejected }` to send refused rows back to review. */
  onSubmit?: (
    params: SpreadsheetSubmitParams<
      ExtractSpreadsheetOutput<TSchema>,
      ExtractSpreadsheetExisting<TSchema>,
      ExtractSpreadsheetContext<TSchema>
    >,
  ) => MaybePromise<void | SpreadsheetSubmitResult>
  submit?: {
    /** Rows per `onSubmit` call. Defaults to every row in one call. */
    batchSize?: number
  }
}

export interface SpreadsheetContextModel<TContext> {
  /** The context, complete once `ready`. */
  readonly ctx: TContext
  readonly loading: boolean
  readonly ready: boolean
  readonly error: unknown
}

export interface SpreadsheetFileModel {
  readonly name: string
  readonly loaded: boolean
  readonly reading: boolean
  /** The file could not be read. */
  readonly error: unknown
  readonly sheets: readonly { name: string; rowCount: number }[]
  /** Reads a file. `name` defaults to the file's name. */
  load(source: SpreadsheetFileSource, name?: string): void
  /** Reads rows copied from a spreadsheet. */
  paste(text: string, name?: string): void
  clear(): void
}

export interface SpreadsheetPreviewRow {
  rowNumber: number
  cells: readonly string[]
  kind: 'title' | 'header' | 'data'
}

export interface SpreadsheetLayoutModel {
  readonly sheet: string | null
  /** Index of the header row among the sheet's rows. */
  readonly headerRow: number
  readonly headerRowNumber: number
  readonly detection: SpreadsheetLayoutDetection | null
  /** The selection is what detection found. */
  readonly detected: boolean
  readonly ambiguous: boolean
  /** Header row candidates of the current sheet, with their scores. */
  readonly candidates: readonly SpreadsheetHeaderRowCandidate[]
  readonly headers: readonly SpreadsheetHeaderCell[]
  /** Rows around the header row, for a preview. */
  readonly preview: readonly SpreadsheetPreviewRow[]
  setSheet(name: string): void
  setHeaderRow(index: number): void
  redetect(): void
}

/** Where a field stands in the file. */
export type SpreadsheetFieldStatus = 'matched' | 'default' | 'missing' | 'unmatched'

export interface SpreadsheetFieldState<TPath extends string = string> {
  path: TPath
  label: string
  /** Name of the column in files. */
  name: string
  description: string
  example: string
  kind: SpreadsheetColumnKind
  group: SpreadsheetFieldGroup | null
  required: boolean
  /** Path of the column a select reads, or `null`. */
  from: string | null
  /**
   * `matched`: a column of the file; `default`: no column, the default fills it; `missing`: a
   * required field without a column; `unmatched`: an optional field without a column.
   */
  status: SpreadsheetFieldStatus
  header: SpreadsheetHeaderCell | null
  /** `file` when a header named the field, `user` when the user chose the column. */
  assignedBy: 'file' | 'user' | null
  /** First distinct values of the column. */
  samples: readonly string[]
  /** For a missing field: a column whose values fit it. Never applied without the user. */
  suggestion: { header: SpreadsheetHeaderCell; samples: readonly string[] } | null
}

export interface SpreadsheetColumnsModel<TPath extends string = string> {
  readonly fields: readonly SpreadsheetFieldState<TPath>[]
  readonly groups: readonly SpreadsheetFieldGroup[]
  readonly missing: readonly SpreadsheetFieldState<TPath>[]
  readonly headers: readonly SpreadsheetHeaderCell[]
  /** Columns of the file no field reads. */
  readonly unusedHeaders: readonly SpreadsheetHeaderCell[]
  /** Reads the field from a column (0-based index). */
  assign(field: TPath, header: number): void
  /** Imports the field without a column. */
  ignore(field: TPath): void
  /** Back to what the headers name. */
  reset(field: TPath): void
}

/** A value to answer: a question, or a field and a value (with a scope id when there is one). */
export interface SpreadsheetValueTarget<TPath extends string = string> {
  field: TPath
  value: string
  scope?: Pick<SpreadsheetValueScope, 'id'> | null
}

export interface SpreadsheetValuesModel<TPath extends string = string> {
  /** Distinct values matching no option, answered or not. */
  readonly questions: readonly SpreadsheetValueQuestion<TPath>[]
  /** Questions without an answer: they block the import. */
  readonly open: readonly SpreadsheetValueQuestion<TPath>[]
  /** Distinct values that matched an option. */
  readonly recognized: readonly SpreadsheetRecognizedValue<TPath>[]
  /** Options are still loading. */
  readonly loading: boolean
  /**
   * Options of a select field, in declared order. Options depending on the row need the row
   * index; without it, they give no options.
   */
  choices(field: TPath, row?: number): readonly SpreadsheetResolvedOption[]
  /** Searches a remote list; other fields filter their options. */
  search(field: TPath, text: string): Promise<readonly SpreadsheetResolvedOption[]>
  /**
   * Answers a question: an option value, or an action. It applies to every row with the value,
   * in the question's scope.
   */
  answer(
    question: SpreadsheetValueTarget<TPath>,
    answer: SpreadsheetValueAnswer | SpreadsheetPrimitiveOption,
  ): void
  clear(question: SpreadsheetValueTarget<TPath>): void
}

export interface SpreadsheetFieldIssue {
  row: number
  issue: SpreadsheetRowIssue
}

export interface SpreadsheetRowsModel<TRow, TExisting, TPath extends string = string> {
  readonly all: readonly SpreadsheetRow<TRow, TExisting>[]
  readonly valid: readonly SpreadsheetRow<TRow, TExisting>[]
  readonly invalid: readonly SpreadsheetRow<TRow, TExisting>[]
  readonly discarded: readonly SpreadsheetRow<TRow, TExisting>[]
  readonly importable: readonly SpreadsheetRow<TRow, TExisting>[]
  /** Importable rows by mode, and skipped stored records. */
  readonly byMode: { create: number; update: number; skip: number }
  /** Fields the row key reads. */
  readonly keyFields: readonly string[]
  /** Stored records are being looked up. */
  readonly loading: boolean
  row(index: number): SpreadsheetRow<TRow, TExisting> | undefined
  cell(index: number, field: TPath): SpreadsheetCellView
  /** Distinct displayed values of a field among rows that are not discarded. */
  distinct(field: TPath): readonly string[]
  /** Issues of a field, or of every field. */
  issues(field?: TPath): readonly SpreadsheetFieldIssue[]
  edit(index: number, field: TPath, text: string): void
  revert(index: number, field: TPath): void
  discard(indexes: readonly number[]): void
  restore(indexes: readonly number[]): void
  /** The invalid rows as an xlsx file, with an Issues column. */
  exportInvalid(): Blob
}

export type SpreadsheetReviewTab = 'all' | 'importable' | 'invalid' | 'discarded'
export type SpreadsheetReviewLevel = 'all' | 'blocking' | 'warnings'
export type SpreadsheetReviewMode = 'all' | 'create' | 'update'

/** One kind of issue across rows. */
export interface SpreadsheetIssueType {
  /** `field|code`, a review issue filter. */
  id: string
  field: string
  code: string
  level: SpreadsheetIssueLevel
  message: string
  rowCount: number
}

export interface SpreadsheetReviewModel<TRow, TExisting> {
  readonly tab: SpreadsheetReviewTab
  readonly level: SpreadsheetReviewLevel
  readonly mode: SpreadsheetReviewMode
  /** `field|code`, `field|*` for every issue of a field, or empty. */
  readonly issue: string
  readonly search: string
  readonly visible: readonly SpreadsheetRow<TRow, TExisting>[]
  readonly selection: ReadonlySet<number>
  readonly inspected: SpreadsheetRow<TRow, TExisting> | null
  readonly issueTypes: readonly SpreadsheetIssueType[]
  /** Rows with an issue on each field, and the most severe level. */
  readonly fieldIssues: ReadonlyMap<string, { rowCount: number; level: SpreadsheetIssueLevel }>
  /** Position of the inspected row among rows with issues. */
  readonly position: { current: number; total: number }
  setTab(tab: SpreadsheetReviewTab): void
  setLevel(level: SpreadsheetReviewLevel): void
  setMode(mode: SpreadsheetReviewMode): void
  setIssue(issue: string): void
  setSearch(search: string): void
  select(indexes: readonly number[], selected: boolean): void
  clearSelection(): void
  inspect(index: number | null): void
  /** Inspects the next row with an issue. */
  next(): void
  previous(): void
}

export type SpreadsheetSubmitStatus = 'idle' | 'running' | 'done' | 'error'

export interface SpreadsheetSubmitModel {
  readonly status: SpreadsheetSubmitStatus
  readonly progress: { done: number; total: number }
  /** Rows the server refused in the last run. */
  readonly rejected: readonly SpreadsheetSubmitRejection[]
  /** Rows imported in the last run. */
  readonly imported: number
  readonly error: unknown
  run(): Promise<void>
  /** Sends again the rows the server refused. */
  retryRejected(): Promise<void>
  reset(): void
}

export interface SpreadsheetReadiness {
  missingColumns: number
  openValues: number
  invalidRows: number
  importable: number
  /** Context, file, options, or stored records are loading. */
  loading: boolean
  /** Something can be imported and nothing blocks it. */
  canSubmit: boolean
}

/** What `useSpreadsheetImport` returns. Every member is reactive and readable in templates. */
export interface SpreadsheetImporter<
  TSchema extends SpreadsheetRuntimeSchema = SpreadsheetRuntimeSchema,
> {
  readonly schema: TSchema
  readonly context: SpreadsheetContextModel<ExtractSpreadsheetContext<TSchema>>
  readonly file: SpreadsheetFileModel
  readonly layout: SpreadsheetLayoutModel
  readonly columns: SpreadsheetColumnsModel<ExtractSpreadsheetFieldPath<TSchema>>
  readonly values: SpreadsheetValuesModel<ExtractSpreadsheetFieldPath<TSchema>>
  readonly rows: SpreadsheetRowsModel<
    ExtractSpreadsheetRow<TSchema>,
    ExtractSpreadsheetExisting<TSchema>,
    ExtractSpreadsheetFieldPath<TSchema>
  >
  readonly review: SpreadsheetReviewModel<
    ExtractSpreadsheetRow<TSchema>,
    ExtractSpreadsheetExisting<TSchema>
  >
  readonly submit: SpreadsheetSubmitModel
  readonly readiness: SpreadsheetReadiness
  /** Resolves when the file is read, the context and options are loaded, and rows are parsed. */
  ready(): Promise<void>
  /** The file to fill in, from the schema and the context. */
  template(): Blob
  /** Clears the file and everything decided about it. */
  reset(): void
}
