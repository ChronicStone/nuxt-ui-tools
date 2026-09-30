import type { QueryKey } from '@tanstack/vue-query'

import type { QueryFunctionResult } from '#ui-tools/shared/types/query'
import type { MaybePromise } from '#ui-tools/shared/types/utils'

import type { SpreadsheetColumnsBuilder, SpreadsheetEntry, SpreadsheetFieldPath } from './columns'
import type { SpreadsheetIssueLevel, SpreadsheetPrettify, SpreadsheetRecord } from './shared'

export interface SpreadsheetFileDefinition {
  /** Accepted extensions. Defaults to `.xlsx`, `.xls`, and `.csv`. */
  accept?: readonly string[]
  /** Rows past this number are left out with the reason `limit`. */
  maxRows?: number
  /** `'auto'` (default): the sheet whose rows match the most columns. Otherwise a sheet name. */
  sheet?: string
  /** `'auto'` (default): the row, among the first 20, matching the most columns. Or a 1-based row. */
  headerRow?: 'auto' | number
}

/** What happens to a row: created, updated from the file, or left as it is. */
export type SpreadsheetRowMode = 'create' | 'update' | 'skip'

/** What to do with a row whose key matches a stored record. */
export type SpreadsheetExistingAction = 'update' | 'skip' | 'error'

/** Value identifying a row: text, a number, or several of them for a key of several fields. */
export type SpreadsheetRowKey = string | number | readonly (string | number)[]

/** A query definition (with `queryKey` and `queryFn`) or a promise of the stored records. */
export type SpreadsheetLookupResult = { queryKey: QueryKey } | MaybePromise<readonly unknown[]>

/** Record type returned by a lookup, from a query definition or a promise. */
export type SpreadsheetLookupRecord<TResult> = unknown extends TResult
  ? unknown
  : TResult extends { queryKey: QueryKey }
    ? QueryFunctionResult<TResult> extends readonly (infer TRecord)[]
      ? TRecord
      : never
    : Awaited<TResult> extends readonly (infer TRecord)[]
      ? TRecord
      : never

export interface SpreadsheetExistingDefinition<TContext, TRow, TKeyValue, TLookup> {
  /**
   * Returns the stored records whose keys are in `keys`, in one query. Called again when the keys
   * of the file change.
   */
  lookup(params: { keys: readonly TKeyValue[]; ctx: TContext }): TLookup
  /** Key of a stored record. Defaults to `rows.key` applied to the record. */
  keyOf?(record: SpreadsheetLookupRecord<TLookup>): TKeyValue
  /**
   * `update` (default) re-syncs the stored record, `skip` leaves it as it is, `error` blocks the
   * row. A function decides per row, with the stored record at hand.
   */
  action?:
    | SpreadsheetExistingAction
    | {
        bivarianceHack(params: {
          row: TRow
          existing: SpreadsheetLookupRecord<TLookup>
          ctx: TContext
        }): SpreadsheetExistingAction
      }['bivarianceHack']
}

export interface SpreadsheetRowsDefinition<TContext, TRow, TKeyValue, TLookup> {
  /**
   * Identifies a row, in the file and among stored records: `(row) => row.secureCode`, or a tuple
   * for several fields. A row whose key is empty is not identified.
   */
  key?(row: TRow): TKeyValue | null | undefined
  /** Two rows of the file with the same key. Defaults to `error`: both rows are blocked. */
  duplicates?: 'error' | 'keep-first' | 'keep-last'
  /** Rows whose key matches a stored record. */
  existing?: SpreadsheetExistingDefinition<TContext, TRow, TKeyValue, TLookup>
}

/** An issue raised by `validate`. */
export interface SpreadsheetIssueInput {
  field: string
  message: string
  level: SpreadsheetIssueLevel
  code: string
}

export type SpreadsheetIssueFactory<TRow> = (
  field: SpreadsheetFieldPath<TRow>,
  message: string,
  options?: { level?: SpreadsheetIssueLevel; code?: string },
) => SpreadsheetIssueInput

type SpreadsheetFalsy = false | null | undefined | 0 | ''

/**
 * What `defineSpreadsheetSchema` receives. Declare `columns` before the callbacks that read rows:
 * they are typed from it.
 */
export interface SpreadsheetSchemaDefinition<TContext, TRow, TKeyValue, TLookup, TOutput> {
  /** Names the import: query keys and the memory of past answers. */
  key: string
  file?: SpreadsheetFileDefinition
  /** The columns, chained: `(c) => c.text(…).select(…)`. */
  columns(
    c: SpreadsheetColumnsBuilder<TContext, NonNullable<unknown>>,
  ): SpreadsheetColumnsBuilder<TContext, TRow>
  rows?: SpreadsheetRowsDefinition<TContext, SpreadsheetPrettify<TRow>, TKeyValue, TLookup>
  /** Rules across fields. Return issues, or falsy values to skip. */
  validate?(params: {
    row: SpreadsheetPrettify<TRow>
    ctx: TContext
    issue: SpreadsheetIssueFactory<SpreadsheetPrettify<TRow>>
  }): readonly (SpreadsheetIssueInput | SpreadsheetFalsy)[]
  /** What `onSubmit` receives for each imported row. Defaults to the row. */
  output?(params: {
    row: SpreadsheetPrettify<TRow>
    mode: Exclude<SpreadsheetRowMode, 'skip'>
    existing: SpreadsheetLookupRecord<TLookup> | undefined
    ctx: TContext
  }): MaybePromise<TOutput>
}

/** A schema, as `defineSpreadsheetSchema` returns it. */
export interface SpreadsheetSchema<
  TContext = unknown,
  TRow = unknown,
  TKeyValue = unknown,
  TLookup = unknown,
  TOutput = unknown,
> extends SpreadsheetSchemaDefinition<TContext, TRow, TKeyValue, TLookup, TOutput> {
  /** Type only. */
  readonly '~context'?: TContext
}

type SpreadsheetSchemaParts<TSchema> =
  TSchema extends SpreadsheetSchema<
    infer TContext,
    infer TRow,
    infer TKey,
    infer TLookup,
    infer TOutput
  >
    ? { context: TContext; row: TRow; key: TKey; lookup: TLookup; output: TOutput }
    : // The erased schema the runtime reads.
      { context: unknown; row: SpreadsheetRecord; key: unknown; lookup: unknown; output: unknown }

export type ExtractSpreadsheetContext<TSchema> = SpreadsheetSchemaParts<TSchema>['context']

export type ExtractSpreadsheetRow<TSchema> = SpreadsheetPrettify<
  SpreadsheetSchemaParts<TSchema>['row']
>

export type ExtractSpreadsheetOutput<TSchema> = SpreadsheetSchemaParts<TSchema>['output']

export type ExtractSpreadsheetExisting<TSchema> = SpreadsheetLookupRecord<
  SpreadsheetSchemaParts<TSchema>['lookup']
>

export type ExtractSpreadsheetKeyValue<TSchema> = SpreadsheetSchemaParts<TSchema>['key']

export type ExtractSpreadsheetFieldPath<TSchema> = SpreadsheetFieldPath<
  ExtractSpreadsheetRow<TSchema>
>

/**
 * A schema as the runtime reads it: every type parameter erased. Any schema made by
 * `defineSpreadsheetSchema` fits it, because its callbacks are declared as methods and the
 * functions the runtime passes to them accept anything.
 */
export interface SpreadsheetRuntimeSchema {
  readonly key: string
  readonly file?: SpreadsheetFileDefinition
  /** Receives the builder; typed loosely so that the builder of any context fits. */
  columns(c: { readonly '~entries': readonly SpreadsheetEntry[] }): {
    readonly '~entries': readonly SpreadsheetEntry[]
  }
  readonly rows?: {
    key?(row: SpreadsheetRecord): unknown
    readonly duplicates?: 'error' | 'keep-first' | 'keep-last'
    readonly existing?: {
      lookup(params: { keys: readonly unknown[]; ctx: unknown }): unknown
      keyOf?(record: unknown): unknown
      readonly action?:
        | SpreadsheetExistingAction
        | {
            bivarianceHack(params: {
              row: SpreadsheetRecord
              existing: unknown
              ctx: unknown
            }): SpreadsheetExistingAction
          }['bivarianceHack']
    }
  }
  validate?(params: {
    row: SpreadsheetRecord
    ctx: unknown
    issue: (
      field: never,
      message: string,
      options?: { level?: SpreadsheetIssueLevel; code?: string },
    ) => SpreadsheetIssueInput
  }): readonly (SpreadsheetIssueInput | SpreadsheetFalsy)[]
  output?(params: {
    row: SpreadsheetRecord
    mode: Exclude<SpreadsheetRowMode, 'skip'>
    existing: unknown
    ctx: unknown
  }): unknown
  /** Type only. */
  readonly '~context'?: unknown
}
