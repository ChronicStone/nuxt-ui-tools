import type { MaybePromise } from '../../shared/types/utils'
import type { SpreadsheetCellValue, SpreadsheetIssueLevel, SpreadsheetQueryDefinition } from './shared'

export interface SpreadsheetColumnValidationParams<TValue, TContext> {
  value: TValue
  context: TContext
  addIssue: (level: SpreadsheetIssueLevel, code: string, message: string) => void
}

export interface SpreadsheetColumnDefinition<
  TKey extends string = string,
  TValue = unknown,
  TRequired extends boolean = boolean,
  TContext = unknown,
> {
  kind: 'text' | 'email' | 'number' | 'date' | 'boolean' | 'enum' | 'option'
  key: TKey
  label?: string | (() => string | number)
  required?: TRequired
  from?: string | RegExp | readonly (string | RegExp)[]
  parse?: (params: {
    cell: SpreadsheetCellValue
    context: TContext
  }) => MaybePromise<TValue>
  validate?: (
    params: SpreadsheetColumnValidationParams<TValue, TContext>,
  ) => MaybePromise<void>
  __valueType?: TValue
}

export interface SpreadsheetColumnGroupDefinition<
  TKey extends string = string,
  TColumns extends readonly unknown[] = readonly unknown[],
> {
  kind: 'group'
  key: TKey
  columns: TColumns
}

export type SpreadsheetStaticColumnEntry =
  | SpreadsheetColumnDefinition<string, unknown, boolean, unknown>
  | SpreadsheetColumnGroupDefinition<string, readonly unknown[]>

type InferColumnValue<TDefault, TParse> = TParse extends (...args: infer _Args) => infer TResult
  ? Awaited<TResult>
  : TDefault

export interface SpreadsheetColumnBaseOptions<TContext, TValue, TRequired extends boolean> {
  label?: string | (() => string | number)
  required?: TRequired
  from?: string | RegExp | readonly (string | RegExp)[]
  parse?: (params: {
    cell: SpreadsheetCellValue
    context: TContext
  }) => MaybePromise<TValue>
  validate?: (
    params: SpreadsheetColumnValidationParams<TValue, TContext>,
  ) => MaybePromise<void>
}

export type SpreadsheetEnumColumnOptions<
  TContext,
  TOptionValue,
  TRequired extends boolean,
> = SpreadsheetColumnBaseOptions<TContext, TOptionValue, TRequired> & {
  options: readonly TOptionValue[]
}

export type SpreadsheetOptionColumnOptions<
  TContext,
  TOption,
  TValue,
  TRequired extends boolean,
> = SpreadsheetColumnBaseOptions<TContext, TValue, TRequired> & {
  options:
    | readonly TOption[]
    | {
        query: (params: {
          context: TContext
          search: string
        }) => SpreadsheetQueryDefinition<readonly TOption[]>
      }
  optionValue: (option: TOption) => TValue
  optionLabel: (option: TOption) => string
}

export interface SpreadsheetColumnBuilder<TContext = unknown> {
  text: <
    TKey extends string,
    TRequired extends boolean = false,
    TParse extends
      | SpreadsheetColumnBaseOptions<TContext, string, TRequired>['parse']
      | undefined = undefined,
  >(
    key: TKey,
    options?: SpreadsheetColumnBaseOptions<TContext, InferColumnValue<string, TParse>, TRequired>,
  ) => SpreadsheetColumnDefinition<TKey, InferColumnValue<string, TParse>, TRequired, TContext>
  email: SpreadsheetColumnBuilder<TContext>['text']
  number: <
    TKey extends string,
    TRequired extends boolean = false,
    TParse extends
      | SpreadsheetColumnBaseOptions<TContext, number, TRequired>['parse']
      | undefined = undefined,
  >(
    key: TKey,
    options?: SpreadsheetColumnBaseOptions<TContext, InferColumnValue<number, TParse>, TRequired>,
  ) => SpreadsheetColumnDefinition<TKey, InferColumnValue<number, TParse>, TRequired, TContext>
  date: SpreadsheetColumnBuilder<TContext>['text']
  boolean: <
    TKey extends string,
    TRequired extends boolean = false,
    TParse extends
      | SpreadsheetColumnBaseOptions<TContext, boolean, TRequired>['parse']
      | undefined = undefined,
  >(
    key: TKey,
    options?: SpreadsheetColumnBaseOptions<TContext, InferColumnValue<boolean, TParse>, TRequired>,
  ) => SpreadsheetColumnDefinition<TKey, InferColumnValue<boolean, TParse>, TRequired, TContext>
  enum: <
    TKey extends string,
    const TOptions extends readonly unknown[],
    TRequired extends boolean = false,
    TParse extends
      | SpreadsheetColumnBaseOptions<TContext, TOptions[number], TRequired>['parse']
      | undefined = undefined,
  >(
    key: TKey,
    options: SpreadsheetEnumColumnOptions<
      TContext,
      InferColumnValue<TOptions[number], TParse>,
      TRequired
    > & { options: TOptions },
  ) => SpreadsheetColumnDefinition<TKey, InferColumnValue<TOptions[number], TParse>, TRequired, TContext>
  option: <
    TKey extends string,
    TOption,
    TValue,
    TRequired extends boolean = false,
    TParse extends
      | SpreadsheetColumnBaseOptions<TContext, TValue, TRequired>['parse']
      | undefined = undefined,
  >(
    key: TKey,
    options: SpreadsheetOptionColumnOptions<TContext, TOption, InferColumnValue<TValue, TParse>, TRequired>,
  ) => SpreadsheetColumnDefinition<TKey, InferColumnValue<TValue, TParse>, TRequired, TContext>
}

export interface SpreadsheetGroupBuilder {
  <TKey extends string, TColumns extends readonly SpreadsheetStaticColumnEntry[]>(
    key: TKey,
    columns: TColumns,
  ): SpreadsheetColumnGroupDefinition<TKey, TColumns>
}

type ArrayElement<TValue> = TValue extends readonly (infer TItem)[] ? TItem : never
type SpreadsheetDynamicCallback<TParams, TResult> = {
  bivarianceHack: (params: TParams) => TResult
}['bivarianceHack']
type SpreadsheetDynamicItemCallback<TResult> = {
  bivarianceHack: (item: unknown) => TResult
}['bivarianceHack']

export interface SpreadsheetDynamicOptionGroupsDefinition<
  TKey extends string = string,
  TInto extends string = string,
  TValue = unknown,
> {
  kind: 'option-groups'
  key: TKey
  source?: readonly unknown[]
  itemKey?: SpreadsheetDynamicItemCallback<string>
  itemLabel?: SpreadsheetDynamicItemCallback<string>
  targetKey?: SpreadsheetDynamicItemCallback<string>
  header?: {
    strategy: 'exact' | 'template' | 'patterns'
    template?: SpreadsheetDynamicCallback<{ source: unknown }, string>
    patterns?: SpreadsheetDynamicCallback<{ source: unknown }, readonly (string | RegExp)[]>
    normalize?: readonly string[]
  }
  options?: {
    resolve: SpreadsheetDynamicItemCallback<readonly unknown[]>
    optionValue: SpreadsheetDynamicItemCallback<TValue>
    optionLabel: SpreadsheetDynamicItemCallback<string>
  }
  values?: {
    mode: 'single' | 'csv'
    separator?: string
    resolve: 'label' | 'value'
    normalize?: readonly string[]
  }
  output: {
    into: TInto
  }
  __valueType?: TValue
}

export type SpreadsheetBuiltDynamicOptionGroupsDefinition<
  TKey extends string,
  TSource extends readonly unknown[],
  TOption,
  TValue,
  TInto extends string,
> = Omit<
  SpreadsheetDynamicOptionGroupsDefinition<TKey, TInto, TValue>,
  'source' | 'itemKey' | 'itemLabel' | 'targetKey' | 'header' | 'options' | 'values'
> & {
  source: TSource
  itemKey: (item: ArrayElement<TSource>) => string
  itemLabel: (item: ArrayElement<TSource>) => string
  targetKey?: (item: ArrayElement<TSource>) => string
  header: {
    strategy: 'exact' | 'template' | 'patterns'
    template?: (params: { source: ArrayElement<TSource> }) => string
    patterns?: (params: { source: ArrayElement<TSource> }) => readonly (string | RegExp)[]
    normalize?: readonly string[]
  }
  options: {
    resolve: (item: ArrayElement<TSource>) => readonly TOption[]
    optionValue: (option: TOption) => TValue
    optionLabel: (option: TOption) => string
  }
  values: {
    mode: 'single' | 'csv'
    separator?: string
    resolve: 'label' | 'value'
    normalize?: readonly string[]
  }
}

export type SpreadsheetDynamicColumnEntry = SpreadsheetDynamicOptionGroupsDefinition<
  string,
  string,
  unknown
>

export interface SpreadsheetDynamicBuilder {
  optionGroups: <
    TKey extends string,
    TSource extends readonly unknown[],
    TOption,
    TValue,
    TInto extends string,
  >(config: {
    key: TKey
    source: TSource
    itemKey: (item: ArrayElement<TSource>) => string
    itemLabel: (item: ArrayElement<TSource>) => string
    targetKey?: (item: ArrayElement<TSource>) => string
    header: {
      strategy: 'exact' | 'template' | 'patterns'
      template?: (params: { source: ArrayElement<TSource> }) => string
      patterns?: (params: { source: ArrayElement<TSource> }) => readonly (string | RegExp)[]
      normalize?: readonly string[]
    }
    options: {
      resolve: (item: ArrayElement<TSource>) => readonly TOption[]
      optionValue: (option: TOption) => TValue
      optionLabel: (option: TOption) => string
    }
    values: {
      mode: 'single' | 'csv'
      separator?: string
      resolve: 'label' | 'value'
      normalize?: readonly string[]
    }
    output: {
      into: TInto
    }
  }) => SpreadsheetBuiltDynamicOptionGroupsDefinition<TKey, TSource, TOption, TValue, TInto>
}

export interface SpreadsheetColumnsDefinition<TContext = unknown> {
  static?:
    | readonly unknown[]
    | ((
        column: SpreadsheetColumnBuilder<TContext>,
        group: SpreadsheetGroupBuilder,
      ) => readonly unknown[])
  dynamic?: (params: {
    dynamic: SpreadsheetDynamicBuilder
    context: TContext
  }) => readonly unknown[]
}

type ResolveSpreadsheetCollection<TCollection> = TCollection extends (...args: infer _Args) => infer TResult
  ? TResult
  : TCollection

export type SpreadsheetResolvedColumns<TColumns> = TColumns extends { static?: infer TStatic }
  ? Omit<TColumns, 'static'> & {
      static?: ResolveSpreadsheetCollection<TStatic>
    }
  : TColumns
