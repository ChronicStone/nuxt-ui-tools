import type { LazyTextValue } from '#ui-tools/shared/types/utils'

import type {
  InferSpreadsheetOptionValue,
  SpreadsheetOptionItem,
  SpreadsheetOptionsInput,
} from './options'
import type { SpreadsheetCell, SpreadsheetHeaderCell, SpreadsheetPrettify } from './shared'
import type { SpreadsheetRule, SpreadsheetRuleBuilder, SpreadsheetRulesInput } from './validation'

export type SpreadsheetColumnKind = 'text' | 'number' | 'date' | 'boolean' | 'select'

/**
 * What happens to a value that is not one of a `select` column's options:
 *
 * - `ask` (default): a question for the user, once per distinct value
 * - `error`: a blocking issue on the row
 * - `skip-rows`: rows using the value are left out of the import
 * - `leave-empty`: the value is dropped
 * - `create`: the value is created with the options' `create` handler when the user imports
 */
export type SpreadsheetUnknownPolicy = 'ask' | 'error' | 'skip-rows' | 'leave-empty' | 'create'

/** Callback typed with the context; stored bivariantly so any context fits the runtime shape. */
export type SpreadsheetContextCallback<TContext, TResult> = {
  bivarianceHack(params: { ctx: TContext }): TResult
}['bivarianceHack']

/** Callback typed with the context and the row so far. */
export type SpreadsheetRowCallback<TContext, TRow, TResult> = {
  bivarianceHack(params: { ctx: TContext; row: TRow }): TResult
}['bivarianceHack']

/**
 * A declared name of the column in files. Strings match exactly, ignoring case, accents, extra
 * spaces, and a trailing `*`; a regex tests the header text; a predicate decides.
 */
export type SpreadsheetHeaderMatcher<TContext = unknown> =
  | string
  | RegExp
  | {
      bivarianceHack(params: { header: SpreadsheetHeaderCell; ctx: TContext }): boolean
    }['bivarianceHack']

export interface SpreadsheetMultipleOptions {
  /** Separator between items. Defaults to a comma. */
  separator?: string
}

/* ------------------------------------------------------------------ runtime entries */

/** Runtime shape of a column's options, with every type parameter erased. */
export interface SpreadsheetColumnConfig {
  label?: LazyTextValue
  headers?: SpreadsheetHeaderMatcher | readonly SpreadsheetHeaderMatcher[]
  required?: boolean
  /** A value, or `({ ctx, row }) => value`. */
  default?: unknown
  when?: SpreadsheetContextCallback<unknown, boolean>
  description?: LazyTextValue
  example?: LazyTextValue
  rules?:
    | readonly SpreadsheetRule<unknown>[]
    | {
        bivarianceHack(
          rules: SpreadsheetRuleBuilder<unknown>,
          params: { row: unknown; ctx: unknown },
        ): readonly SpreadsheetRule<unknown>[]
      }['bivarianceHack']
  editable?: boolean
  multiple?: boolean | SpreadsheetMultipleOptions
  parse?: {
    bivarianceHack(params: { cell: SpreadsheetCell; ctx: unknown; row: unknown }): unknown
  }['bivarianceHack']
  /** `number` */
  decimal?: '.' | ','
  /** `date` */
  formats?: readonly string[]
  /** `boolean` */
  true?: readonly string[]
  false?: readonly string[]
  /** `select` */
  options?: SpreadsheetOptionsInput<unknown, SpreadsheetOptionItem, unknown>
  from?: string
  unknown?: SpreadsheetUnknownPolicy
}

/** A column, as the builder records it. */
export interface SpreadsheetColumnEntry<TKey extends string = string> {
  readonly entry: 'column'
  readonly kind: SpreadsheetColumnKind
  readonly key: TKey
  readonly config: SpreadsheetColumnConfig
}

export interface SpreadsheetGroupOptions<TContext> {
  label?: LazyTextValue
  description?: LazyTextValue
  when?: SpreadsheetContextCallback<TContext, boolean>
}

/** A group: its columns are nested under its key in the row. */
export interface SpreadsheetGroupEntry {
  readonly entry: 'group'
  readonly key: string
  readonly config: SpreadsheetGroupOptions<unknown>
  readonly children: readonly SpreadsheetColumnEntry[]
}

/** A group whose columns are built from the context, one per item. */
export interface SpreadsheetDynamicEntry {
  readonly entry: 'dynamic'
  readonly key: string
  readonly config: SpreadsheetGroupOptions<unknown> & {
    items: SpreadsheetContextCallback<unknown, readonly unknown[]>
    column: {
      bivarianceHack(
        item: unknown,
        factory: SpreadsheetColumnFactory<never, never>,
      ): SpreadsheetColumnEntry
    }['bivarianceHack']
  }
}

export type SpreadsheetEntry =
  | SpreadsheetColumnEntry
  | SpreadsheetGroupEntry
  | SpreadsheetDynamicEntry

/* ------------------------------------------------------------------ value inference */

type SpreadsheetItems<TItem, TMultiple> = [TMultiple] extends [undefined | false] ? TItem : TItem[]

/**
 * Value of a column in the row: an array with `multiple` (empty when the cell is), otherwise the
 * item, or `null` when the cell can be empty (not required and without a default).
 */
export type SpreadsheetColumnValue<TItem, TMultiple, TRequired, TDefault> = [TMultiple] extends [
  undefined | false,
]
  ? [TRequired] extends [true]
    ? TItem
    : [TDefault] extends [never]
      ? TItem | null
      : TItem
  : TItem[]

export type SpreadsheetIsOptional<TWhen> = [TWhen] extends [never] ? false : true

type SpreadsheetItem<TParsed, TFallback> = [TParsed] extends [never] ? TFallback : TParsed

/** The row with one more column. */
export type SpreadsheetWith<TRow, TKey extends string, TValue, TOptional> = TOptional extends true
  ? TRow & { [K in TKey]?: TValue }
  : TRow & { [K in TKey]: TValue }

/** A key the row does not have yet; declaring a key twice is a type error. */
type SpreadsheetNewKey<TKey extends string, TRow> = TKey &
  NoInfer<TKey extends keyof TRow ? { duplicateColumn: TKey } : unknown>

/* ------------------------------------------------------------------ column options */

/** Options shared by every column. `TRow` is the row so far: the columns declared above. */
export interface SpreadsheetColumnCommonOptions<TContext, TRow, TItem> {
  /** Name of the field everywhere in the UI. Also a header the column matches. */
  label?: LazyTextValue
  /** Other names the column has in files. Defaults to the label and the key. */
  headers?: SpreadsheetHeaderMatcher<TContext> | readonly SpreadsheetHeaderMatcher<TContext>[]
  /** Shown with the expected columns, in the template, and in mapping hints. */
  description?: LazyTextValue
  /** Sample value for the template. */
  example?: LazyTextValue
  /** Checks on each non-empty value (each item with `multiple`); the function form reads the row. */
  rules?: SpreadsheetRulesInput<NoInfer<TItem>, TContext, TRow>
  /** Whether the cell can be edited in review. Defaults to `true`. */
  editable?: boolean
}

/** Options whose presence changes the value type; their generics are inferred from return types. */
interface SpreadsheetTypedOptions<TContext, TRow, TMultiple, TRequired, TDefault, TWhen> {
  /** A required column without a match blocks the import; an empty cell is a blocking issue. */
  required?: TRequired
  /** Used when the column is missing from the file or the cell is empty. */
  default?: TDefault | ((params: { ctx: TContext; row: TRow }) => TDefault)
  /** Includes the column only when it returns `true` for the context. */
  when?: (params: { ctx: TContext }) => TWhen
  /** Splits the cell into items, on commas unless a separator is given. */
  multiple?: TMultiple
}

type SpreadsheetScalarOptions<
  TContext,
  TRow,
  TItem,
  TParsed,
  TMultiple,
  TRequired,
  TDefault,
  TWhen,
> = SpreadsheetColumnCommonOptions<TContext, TRow, TItem> &
  SpreadsheetTypedOptions<TContext, TRow, TMultiple, TRequired, TDefault, TWhen> & {
    /** Reads the cell yourself; its return type becomes the value type. */
    parse?: (params: { cell: SpreadsheetCell; ctx: TContext; row: TRow }) => TParsed
  }

export interface SpreadsheetNumberOptions {
  /** Decimal separator of the file. Defaults to `.`; thousands separators are ignored. */
  decimal?: '.' | ','
}

export interface SpreadsheetDateOptions {
  /**
   * Text formats to read, like `dd/MM/yyyy` or `MMMM d, yyyy h:mm a`. Excel dates are read
   * whatever the format. The value is an ISO date, with the time when the format has one.
   */
  formats?: readonly string[]
}

export interface SpreadsheetBooleanOptions {
  /** Texts read as `true`. Defaults to yes, oui, true, vrai, x, 1. */
  true?: readonly string[]
  /** Texts read as `false`. Defaults to no, non, false, faux, 0. */
  false?: readonly string[]
}

export type SpreadsheetSelectOptions<
  TContext,
  TRow,
  TOption,
  TMultiple,
  TRequired,
  TDefault,
  TWhen,
  TFrom,
> = SpreadsheetColumnCommonOptions<TContext, TRow, InferSpreadsheetOptionValue<TOption>> &
  SpreadsheetTypedOptions<TContext, TRow, TMultiple, TRequired, TDefault, TWhen> & {
    /**
     * The known values: a list, a query, a remote loader, or `({ ctx, row }) => list`. A cell
     * matches an option on its label, value, or an alias, exactly.
     */
    options: SpreadsheetOptionsInput<TContext, TOption, TRow>
    /** Reads the cell of a column declared above, like a product from an exam name. */
    from?: TFrom
    /** What to do with a value that is not an option. Defaults to `ask`. */
    unknown?: SpreadsheetUnknownPolicy
  }

/* ------------------------------------------------------------------ builders */

type SpreadsheetBuilderKind = 'root' | 'group' | 'factory'

/** What the row looks like to the callbacks of a column. */
type SpreadsheetScope<TKind, TRow, TOuter, TGroupKey extends string> = TKind extends 'group'
  ? SpreadsheetPrettify<TOuter & { [K in TGroupKey]: SpreadsheetPrettify<TRow> }>
  : TKind extends 'factory'
    ? SpreadsheetPrettify<TOuter>
    : SpreadsheetPrettify<TRow>

type SpreadsheetNext<
  TKind,
  TContext,
  TRow,
  TOuter,
  TGroupKey extends string,
  TKey extends string,
  TValue,
  TOptional,
> = TKind extends 'group'
  ? SpreadsheetGroupBuilder<
      TContext,
      TOuter,
      TGroupKey,
      SpreadsheetWith<TRow, TKey, TValue, TOptional>
    >
  : TKind extends 'factory'
    ? SpreadsheetColumnSpec<TKey, TValue>
    : SpreadsheetColumnsBuilder<TContext, SpreadsheetWith<TRow, TKey, TValue, TOptional>>

type SpreadsheetScalarMethod<
  TKind extends SpreadsheetBuilderKind,
  TContext,
  TRow,
  TOuter,
  TGroupKey extends string,
  TFallback,
  TExtra,
> = <
  const TKey extends string,
  TParsed = never,
  TMultiple extends boolean | SpreadsheetMultipleOptions | undefined = undefined,
  TRequired extends boolean | undefined = undefined,
  TDefault extends SpreadsheetItems<SpreadsheetItem<TParsed, TFallback>, TMultiple> = never,
  TWhen extends boolean = never,
>(
  key: SpreadsheetNewKey<TKey, TRow>,
  options?: SpreadsheetScalarOptions<
    TContext,
    SpreadsheetScope<TKind, TRow, TOuter, TGroupKey>,
    SpreadsheetItem<TParsed, TFallback>,
    TParsed,
    TMultiple,
    TRequired,
    TDefault,
    TWhen
  > &
    TExtra,
) => SpreadsheetNext<
  TKind,
  TContext,
  TRow,
  TOuter,
  TGroupKey,
  TKey,
  NoInfer<
    SpreadsheetColumnValue<SpreadsheetItem<TParsed, TFallback>, TMultiple, TRequired, TDefault>
  >,
  NoInfer<SpreadsheetIsOptional<TWhen>>
>

/** The column methods every builder has: text, number, date, boolean, select. */
export interface SpreadsheetColumnMethods<
  TKind extends SpreadsheetBuilderKind,
  TContext,
  TRow,
  TOuter,
  TGroupKey extends string,
> {
  text: SpreadsheetScalarMethod<
    TKind,
    TContext,
    TRow,
    TOuter,
    TGroupKey,
    string,
    NonNullable<unknown>
  >
  number: SpreadsheetScalarMethod<
    TKind,
    TContext,
    TRow,
    TOuter,
    TGroupKey,
    number,
    SpreadsheetNumberOptions
  >
  date: SpreadsheetScalarMethod<
    TKind,
    TContext,
    TRow,
    TOuter,
    TGroupKey,
    string,
    SpreadsheetDateOptions
  >
  boolean: SpreadsheetScalarMethod<
    TKind,
    TContext,
    TRow,
    TOuter,
    TGroupKey,
    boolean,
    SpreadsheetBooleanOptions
  >
  select: <
    const TKey extends string,
    const TOption extends SpreadsheetOptionItem,
    TMultiple extends boolean | SpreadsheetMultipleOptions | undefined = undefined,
    TRequired extends boolean | undefined = undefined,
    TDefault extends SpreadsheetItems<InferSpreadsheetOptionValue<TOption>, TMultiple> = never,
    TWhen extends boolean = never,
    const TFrom extends SpreadsheetFieldPath<SpreadsheetScope<TKind, TRow, TOuter, TGroupKey>> =
      never,
  >(
    key: SpreadsheetNewKey<TKey, TRow>,
    options: SpreadsheetSelectOptions<
      TContext,
      SpreadsheetScope<TKind, TRow, TOuter, TGroupKey>,
      TOption,
      TMultiple,
      TRequired,
      TDefault,
      TWhen,
      TFrom
    >,
  ) => SpreadsheetNext<
    TKind,
    TContext,
    TRow,
    TOuter,
    TGroupKey,
    TKey,
    NoInfer<
      SpreadsheetColumnValue<InferSpreadsheetOptionValue<TOption>, TMultiple, TRequired, TDefault>
    >,
    NoInfer<SpreadsheetIsOptional<TWhen>>
  >
}

/**
 * The `c` of `columns: (c) => c.text(…).select(…)`. Each method adds a column and returns the
 * builder; callbacks of a column receive the row so far, typed.
 */
export interface SpreadsheetColumnsBuilder<TContext, TRow> extends SpreadsheetColumnMethods<
  'root',
  TContext,
  TRow,
  unknown,
  never
> {
  /** Columns nested under `key`; their callbacks also read the columns declared above the group. */
  group: <const TKey extends string, TGroupRow, TWhen extends boolean = never>(
    key: SpreadsheetNewKey<TKey, TRow>,
    options: Omit<SpreadsheetGroupOptions<TContext>, 'when'> & {
      when?: (params: { ctx: TContext }) => TWhen
    },
    build: (
      group: SpreadsheetGroupBuilder<
        TContext,
        SpreadsheetPrettify<TRow>,
        TKey,
        NonNullable<unknown>
      >,
    ) => SpreadsheetGroupBuilder<TContext, SpreadsheetPrettify<TRow>, TKey, TGroupRow>,
  ) => SpreadsheetColumnsBuilder<
    TContext,
    SpreadsheetWith<
      TRow,
      TKey,
      SpreadsheetPrettify<TGroupRow>,
      NoInfer<SpreadsheetIsOptional<TWhen>>
    >
  >
  /**
   * A group with one column per item of the context, like one column per affiliation group. Its
   * value is a record keyed by the columns' keys.
   */
  dynamic: <const TKey extends string, TItem, TValue, TWhen extends boolean = never>(
    key: SpreadsheetNewKey<TKey, TRow>,
    options: Omit<SpreadsheetGroupOptions<TContext>, 'when'> & {
      when?: (params: { ctx: TContext }) => TWhen
      /** The items, one column each. */
      items: (params: { ctx: TContext }) => readonly TItem[]
      /** The column of an item, built with `c`. */
      column: (
        item: TItem,
        c: SpreadsheetColumnFactory<TContext, SpreadsheetPrettify<TRow>>,
      ) => SpreadsheetColumnSpec<string, TValue>
    },
  ) => SpreadsheetColumnsBuilder<
    TContext,
    SpreadsheetWith<TRow, TKey, { [key: string]: TValue }, NoInfer<SpreadsheetIsOptional<TWhen>>>
  >
  /** Runtime: the columns declared so far. */
  readonly '~entries': readonly SpreadsheetEntry[]
  /** Type only. */
  readonly '~row'?: TRow
}

/** The builder inside a group. */
export interface SpreadsheetGroupBuilder<
  TContext,
  TOuter,
  TGroupKey extends string,
  TRow,
> extends SpreadsheetColumnMethods<'group', TContext, TRow, TOuter, TGroupKey> {
  /** Runtime: the columns declared so far. */
  readonly '~entries': readonly SpreadsheetEntry[]
  /** Type only. */
  readonly '~row'?: TRow
}

/** The `c` of a dynamic group's `column`: each method returns one column. */
export type SpreadsheetColumnFactory<TContext, TScope> = SpreadsheetColumnMethods<
  'factory',
  TContext,
  NonNullable<unknown>,
  TScope,
  never
>

/** One column built by a factory. */
export interface SpreadsheetColumnSpec<
  TKey extends string,
  TValue,
> extends SpreadsheetColumnEntry<TKey> {
  /** Type only. */
  readonly '~value'?: TValue
}

/* ------------------------------------------------------------------ row inference */

/** Row type of a columns builder. */
export type SpreadsheetRowOf<TBuilder> = TBuilder extends { '~row'?: infer TRow }
  ? SpreadsheetPrettify<TRow>
  : never

type SpreadsheetIsNested<TValue> = [NonNullable<TValue>] extends [never]
  ? false
  : NonNullable<TValue> extends readonly unknown[]
    ? false
    : NonNullable<TValue> extends Record<string, unknown>
      ? true
      : false

/** Path of every field of a row, like `secureCode` or `levels.general`. */
export type SpreadsheetFieldPath<TRow> = string extends keyof TRow
  ? string
  : {
      [TKey in keyof TRow & string]: SpreadsheetIsNested<TRow[TKey]> extends true
        ? `${TKey}.${SpreadsheetFieldPath<NonNullable<TRow[TKey]>>}`
        : TKey
    }[keyof TRow & string]

/** Value of a field path in a row. */
export type SpreadsheetFieldValue<
  TRow,
  TPath extends string,
> = TPath extends `${infer THead}.${infer TRest}`
  ? THead extends keyof TRow
    ? SpreadsheetFieldValue<NonNullable<TRow[THead]>, TRest>
    : never
  : TPath extends keyof TRow
    ? TRow[TPath]
    : never
