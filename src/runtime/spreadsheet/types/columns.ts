import type { MaybePromise } from '../../shared/types/utils'
import type {
  SpreadsheetCellValue,
  SpreadsheetMatchDefinition,
} from './shared'
import type { SpreadsheetFieldRulesInput } from './validation'

export interface SpreadsheetColumnDefinition<
  TKey extends string = string,
  TValue = unknown,
  TRequired extends boolean = boolean,
  TContext = unknown,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = undefined,
> {
  kind: 'text' | 'email' | 'number' | 'date' | 'boolean' | 'enum' | 'option'
  key: TKey
  label?: string | (() => string | number)
  required?: TRequired
  match?: SpreadsheetMatchDefinition
  from?: string | RegExp | readonly (string | RegExp)[]
  multiple?: boolean | {
    separator?: string
    matchBy?: 'label' | 'value'
    normalize?: readonly string[]
  }
  parse?: (params: {
    cell: SpreadsheetCellValue
    context: TContext
  }) => MaybePromise<TValue>
  rules?: SpreadsheetFieldRulesInput<TValue>
  __rulesInput?: TRulesInput
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
type ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple> =
  TParse extends (...args: infer _Args) => infer TResult
    ? Awaited<TResult>
    : TMultiple extends false | undefined
      ? TDefault
      : TDefault[]
type SpreadsheetOptionLabelResolver<TOption> = {
  bivarianceHack: (option: TOption) => string
}['bivarianceHack']
type SpreadsheetOptionValueResolver<TOption, TValue> = {
  bivarianceHack: (option: TOption) => TValue
}['bivarianceHack']
type SpreadsheetOptionSourceResolver<TContext, TOption> = {
  bivarianceHack: (params: {
    context: TContext
  }) => readonly TOption[]
}['bivarianceHack']
type SpreadsheetOptionSource<TContext, TOption> =
  | readonly TOption[]
  | SpreadsheetOptionSourceResolver<TContext, TOption>

type SpreadsheetStandardOption<TValue = unknown> = {
  label: string
  value: TValue
}

export interface SpreadsheetColumnMultipleOptions {
  separator?: string
}

export interface SpreadsheetEnumColumnMultipleOptions extends SpreadsheetColumnMultipleOptions {
  normalize?: readonly string[]
}

export interface SpreadsheetOptionColumnMultipleOptions extends SpreadsheetColumnMultipleOptions {
  matchBy?: 'label' | 'value'
  normalize?: readonly string[]
}

export interface SpreadsheetColumnBaseOptions<
  TContext,
  TValue,
  TRequired extends boolean,
  TMultiple = boolean | SpreadsheetColumnMultipleOptions,
> {
  label?: string | (() => string | number)
  required?: TRequired
  match?: SpreadsheetMatchDefinition
  from?: string | RegExp | readonly (string | RegExp)[]
  multiple?: TMultiple
  parse?: (params: {
    cell: SpreadsheetCellValue
    context: TContext
  }) => MaybePromise<TValue>
  rules?: SpreadsheetFieldRulesInput<TValue>
}

export type SpreadsheetEnumColumnOptions<
  TContext,
  TOptionValue,
  TRequired extends boolean,
  TMultiple = boolean | SpreadsheetEnumColumnMultipleOptions,
  TResolvedValue = TOptionValue,
> = SpreadsheetColumnBaseOptions<TContext, TResolvedValue, TRequired, TMultiple> & {
  options: readonly TOptionValue[]
}

export type SpreadsheetOptionColumnOptions<
  TContext,
  TOption,
  TValue,
  TRequired extends boolean,
  TMultiple = boolean | SpreadsheetOptionColumnMultipleOptions,
  TResolvedValue = TValue,
> = SpreadsheetColumnBaseOptions<TContext, TResolvedValue, TRequired, TMultiple> & {
  options:
    | SpreadsheetOptionSource<TContext, TOption>
    | (
      TOption extends SpreadsheetStandardOption<any>
        ? {
            resolve: SpreadsheetOptionSource<TContext, TOption>
            optionValue?: SpreadsheetOptionValueResolver<TOption, TValue>
            optionLabel?: SpreadsheetOptionLabelResolver<TOption>
          }
        : {
            resolve: SpreadsheetOptionSource<TContext, TOption>
            optionValue: SpreadsheetOptionValueResolver<TOption, TValue>
            optionLabel: SpreadsheetOptionLabelResolver<TOption>
          }
    )
}

export interface SpreadsheetScalarColumnBuilder<
  TContext = unknown,
  TDefault = unknown,
  TMultipleConfig = SpreadsheetColumnMultipleOptions,
> {
  <
    TKey extends string,
    TRequired extends boolean = false,
    TMultiple extends boolean | TMultipleConfig | undefined = undefined,
    TParse extends
      | SpreadsheetColumnBaseOptions<
        TContext,
        ResolveSpreadsheetColumnValue<TDefault, undefined, TMultiple>,
        TRequired,
        Exclude<TMultiple, undefined>
      >['parse']
      | undefined = undefined,
    TRulesInput extends SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple>> | undefined = SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple>> | undefined,
  >(
    key: TKey,
    options?: SpreadsheetColumnBaseOptions<
      TContext,
      ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple>,
      TRequired,
      Exclude<TMultiple, undefined>
    > & {
      rules?: TRulesInput
    },
  ): SpreadsheetColumnDefinition<TKey, ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple>, TRequired, TContext, TRulesInput>
}

export interface SpreadsheetOptionColumnBuilder<TContext = unknown> {
  <
    TKey extends string,
    TOption,
    TValue,
    TRequired extends boolean = false,
    TMultiple extends boolean | SpreadsheetOptionColumnMultipleOptions | undefined = undefined,
    TParse extends
      | SpreadsheetColumnBaseOptions<
        TContext,
        ResolveSpreadsheetColumnValue<TValue, undefined, TMultiple>,
        TRequired,
        Exclude<TMultiple, undefined>
      >['parse']
      | undefined = undefined,
    TRulesInput extends SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TValue, TParse, TMultiple>> | undefined = SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TValue, TParse, TMultiple>> | undefined,
  >(
    key: TKey,
    options: SpreadsheetColumnBaseOptions<
      TContext,
      ResolveSpreadsheetColumnValue<TValue, TParse, TMultiple>,
      TRequired,
      Exclude<TMultiple, undefined>
    > & {
      rules?: TRulesInput
      options: {
        resolve: SpreadsheetOptionSource<TContext, TOption>
        optionValue: SpreadsheetOptionValueResolver<TOption, TValue>
        optionLabel: SpreadsheetOptionLabelResolver<TOption>
      }
    },
  ): SpreadsheetColumnDefinition<TKey, ResolveSpreadsheetColumnValue<TValue, TParse, TMultiple>, TRequired, TContext, TRulesInput>
  <
    TKey extends string,
    TOption extends SpreadsheetStandardOption<any>,
    TRequired extends boolean = false,
    TMultiple extends boolean | SpreadsheetOptionColumnMultipleOptions | undefined = undefined,
    TParse extends
      | SpreadsheetColumnBaseOptions<
        TContext,
        ResolveSpreadsheetColumnValue<TOption['value'], undefined, TMultiple>,
        TRequired,
        Exclude<TMultiple, undefined>
      >['parse']
      | undefined = undefined,
    TRulesInput extends SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TOption['value'], TParse, TMultiple>> | undefined = SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TOption['value'], TParse, TMultiple>> | undefined,
  >(
    key: TKey,
    options: SpreadsheetColumnBaseOptions<
      TContext,
      ResolveSpreadsheetColumnValue<TOption['value'], TParse, TMultiple>,
      TRequired,
      Exclude<TMultiple, undefined>
    > & {
      rules?: TRulesInput
      options:
        | SpreadsheetOptionSource<TContext, TOption>
        | {
            resolve: SpreadsheetOptionSource<TContext, TOption>
            optionValue?: SpreadsheetOptionValueResolver<TOption, TOption['value']>
            optionLabel?: SpreadsheetOptionLabelResolver<TOption>
          }
    },
  ): SpreadsheetColumnDefinition<TKey, ResolveSpreadsheetColumnValue<TOption['value'], TParse, TMultiple>, TRequired, TContext, TRulesInput>
}

export interface SpreadsheetColumnBuilder<TContext = unknown> {
  text: SpreadsheetScalarColumnBuilder<TContext, string>
  email: SpreadsheetScalarColumnBuilder<TContext, string>
  number: SpreadsheetScalarColumnBuilder<TContext, number>
  date: SpreadsheetScalarColumnBuilder<TContext, string>
  boolean: SpreadsheetScalarColumnBuilder<TContext, boolean>
  enum: <
    TKey extends string,
    const TOptions extends readonly unknown[],
    TRequired extends boolean = false,
    TMultiple extends boolean | SpreadsheetEnumColumnMultipleOptions | undefined = undefined,
    TParse extends
      | SpreadsheetColumnBaseOptions<
        TContext,
        ResolveSpreadsheetColumnValue<TOptions[number], undefined, TMultiple>,
        TRequired,
        Exclude<TMultiple, undefined>
      >['parse']
      | undefined = undefined,
    TRulesInput extends SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TOptions[number], TParse, TMultiple>> | undefined = SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<TOptions[number], TParse, TMultiple>> | undefined,
  >(
    key: TKey,
    options: SpreadsheetEnumColumnOptions<
      TContext,
      TOptions[number],
      TRequired,
      Exclude<TMultiple, undefined>,
      ResolveSpreadsheetColumnValue<TOptions[number], TParse, TMultiple>
    > & {
      rules?: TRulesInput
      options: TOptions
    },
  ) => SpreadsheetColumnDefinition<TKey, ResolveSpreadsheetColumnValue<TOptions[number], TParse, TMultiple>, TRequired, TContext, TRulesInput>
  option: SpreadsheetOptionColumnBuilder<TContext>
}

export interface SpreadsheetGroupBuilder {
  <TKey extends string, TColumns extends readonly SpreadsheetStaticColumnEntry[]>(
    key: TKey,
    columns: TColumns,
  ): SpreadsheetColumnGroupDefinition<TKey, TColumns>
}

type ArrayElement<TValue> = TValue extends readonly (infer TItem)[] ? TItem : never
type SpreadsheetDynamicCollectionCallback<TParams, TResult> = (params: TParams) => TResult
type SpreadsheetDynamicCallback<TParams, TResult> = (params: TParams) => TResult
type SpreadsheetDynamicItemCallback<TResult> = SpreadsheetDynamicCallback<unknown, TResult>

export interface SpreadsheetDynamicTextValueDefinition {
  kind: 'text'
  normalize?: readonly string[]
}

export interface SpreadsheetDynamicNumberValueDefinition {
  kind: 'number'
}

export interface SpreadsheetDynamicDateValueDefinition {
  kind: 'date'
}

export interface SpreadsheetDynamicBooleanValueDefinition {
  kind: 'boolean'
}

type InferSpreadsheetOptionValue<TOption, TOptionValue> =
  TOptionValue extends (...args: infer _Args) => infer TResult
    ? TResult
    : TOption extends { value: infer TValue }
      ? TValue
      : never

export interface SpreadsheetDynamicOptionsValueDefinition<
  TOption = unknown,
  TValue = unknown,
  TMode extends 'single' | 'multiple' = 'single',
> {
  kind: 'options'
  from: readonly TOption[]
  optionLabel?: SpreadsheetOptionLabelResolver<TOption>
  optionValue?: SpreadsheetOptionValueResolver<TOption, TValue>
  mode: TMode
  separator?: string
  matchBy: 'label' | 'value'
  normalize?: readonly string[]
}

export type SpreadsheetDynamicValueDefinition =
  | SpreadsheetDynamicTextValueDefinition
  | SpreadsheetDynamicNumberValueDefinition
  | SpreadsheetDynamicDateValueDefinition
  | SpreadsheetDynamicBooleanValueDefinition
  | SpreadsheetDynamicOptionsValueDefinition<unknown, unknown, 'single' | 'multiple'>

type SpreadsheetDynamicResolvedValue<TValueDefinition> =
  TValueDefinition extends SpreadsheetDynamicTextValueDefinition ? string
    : TValueDefinition extends SpreadsheetDynamicNumberValueDefinition ? number
      : TValueDefinition extends SpreadsheetDynamicDateValueDefinition ? string
        : TValueDefinition extends SpreadsheetDynamicBooleanValueDefinition ? boolean
          : TValueDefinition extends SpreadsheetDynamicOptionsValueDefinition<any, infer TValue, infer TMode>
            ? TMode extends 'multiple'
              ? TValue[]
              : TValue
            : never

type SpreadsheetDynamicDefaultArrayItem<
  TId extends string,
  TValueDefinition extends SpreadsheetDynamicValueDefinition,
> = SpreadsheetDynamicResolvedValue<TValueDefinition> extends infer TResult
  ? TResult extends readonly unknown[]
    ? { id: TId, values: TResult }
    : { id: TId, value: TResult }
  : never

type SpreadsheetDynamicDefaultRecordValue<
  TValueDefinition extends SpreadsheetDynamicValueDefinition,
> = SpreadsheetDynamicResolvedValue<TValueDefinition>

type SpreadsheetDynamicBuildParams<
  TSource,
  TId extends string,
  TValueDefinition extends SpreadsheetDynamicValueDefinition,
> = {
  id: TId
  source: TSource
  value?: SpreadsheetDynamicResolvedValue<TValueDefinition>
  values?: SpreadsheetDynamicResolvedValue<TValueDefinition>
}

export interface SpreadsheetDynamicValueBuilder {
  text: (config?: {
    normalize?: readonly string[]
  }) => SpreadsheetDynamicTextValueDefinition
  number: () => SpreadsheetDynamicNumberValueDefinition
  date: () => SpreadsheetDynamicDateValueDefinition
  boolean: () => SpreadsheetDynamicBooleanValueDefinition
  options<
    TOption,
    TValue = TOption extends { value: infer TResolvedValue }
      ? TResolvedValue
      : never,
    TMode extends 'single' | 'multiple' = 'single',
  >(
    config: {
    from: readonly TOption[]
    optionLabel?: (option: TOption) => string
    optionValue?: (option: TOption) => TValue
    mode?: TMode
    separator?: string
    matchBy: 'label' | 'value'
    normalize?: readonly string[]
  } & (
      TOption extends SpreadsheetStandardOption<any>
        ? {}
        : {
            optionLabel: (option: TOption) => string
            optionValue: (option: TOption) => TValue
          }
    ),
  ): SpreadsheetDynamicOptionsValueDefinition<TOption, TValue, TMode>
}

type SpreadsheetDynamicValueResolver<TValueDefinition extends SpreadsheetDynamicValueDefinition> =
  | TValueDefinition
  | ((value: SpreadsheetDynamicValueBuilder) => TValueDefinition)

type SpreadsheetDynamicValueInput =
  | SpreadsheetDynamicValueDefinition
  | ((value: SpreadsheetDynamicValueBuilder) => unknown)

type ResolveSpreadsheetDynamicValueInput<TValueInput> =
  TValueInput extends (...args: infer _Args) => infer TValueDefinition
    ? TValueDefinition extends SpreadsheetDynamicValueDefinition
      ? TValueDefinition
      : never
    : TValueInput extends SpreadsheetDynamicValueDefinition
      ? TValueInput
      : never

type SpreadsheetDynamicCollectionItemShape<
  TSource = unknown,
> = {
  id: string
  match: SpreadsheetMatchDefinition
  value: SpreadsheetDynamicValueInput
  build?: SpreadsheetDynamicCollectionCallback<
    SpreadsheetDynamicBuildParams<TSource, string, SpreadsheetDynamicValueDefinition>,
    unknown
  >
}

export interface SpreadsheetDynamicCollectionItemDefinition<
  TId extends string = string,
  TValueInput extends SpreadsheetDynamicValueInput = SpreadsheetDynamicValueInput,
  TSource = unknown,
  TBuild = unknown,
> {
  id: TId
  match: SpreadsheetMatchDefinition
  value: TValueInput
  build?: SpreadsheetDynamicCollectionCallback<
    SpreadsheetDynamicBuildParams<TSource, TId, ResolveSpreadsheetDynamicValueInput<TValueInput>>,
    TBuild
  >
  source?: TSource
}

export interface SpreadsheetDynamicCollectionDefinition<
  TRootKey extends string = string,
  TAs extends 'array' | 'record' = 'record',
  TItems = readonly unknown[],
  TOutput = unknown,
> {
  kind: 'collection'
  rootKey: TRootKey
  as: TAs
  items: TItems
  __outputType?: TOutput
}

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
> | SpreadsheetDynamicCollectionDefinition<
  string,
  'array' | 'record',
  readonly SpreadsheetDynamicCollectionItemDefinition[],
  unknown
>

export interface SpreadsheetDynamicBuilder<TContext = unknown> {
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
  arrayFromCollection: <
    TRootKey extends string,
    TSource extends readonly unknown[],
    TItem extends SpreadsheetDynamicCollectionItemShape<TSource[number]>,
  >(
    rootKey: TRootKey,
    config: {
      from: SpreadsheetDynamicCollectionCallback<{ context: TContext }, TSource>
      each: SpreadsheetDynamicCollectionCallback<TSource[number], TItem>
    },
  ) => SpreadsheetDynamicCollectionDefinition<
    TRootKey,
    'array',
    readonly TItem[],
    TItem extends { id: infer TId extends string, value: infer TValueInput, build?: infer TBuild }
      ? [TBuild] extends [unknown]
        ? SpreadsheetDynamicDefaultArrayItem<TId, ResolveSpreadsheetDynamicValueInput<TValueInput>>
        : TBuild
      : never
  >
  recordFromCollection: <
    TRootKey extends string,
    TSource extends readonly unknown[],
    TItem extends SpreadsheetDynamicCollectionItemShape<TSource[number]>,
  >(
    rootKey: TRootKey,
    config: {
      from: SpreadsheetDynamicCollectionCallback<{ context: TContext }, TSource>
      each: SpreadsheetDynamicCollectionCallback<TSource[number], TItem>
    },
  ) => SpreadsheetDynamicCollectionDefinition<
    TRootKey,
    'record',
    readonly TItem[],
    TItem extends { value: infer TValueInput, build?: infer TBuild }
      ? [TBuild] extends [unknown]
        ? SpreadsheetDynamicDefaultRecordValue<ResolveSpreadsheetDynamicValueInput<TValueInput>>
        : TBuild
      : never
  >
}

export interface SpreadsheetColumnsDefinition<TContext = unknown> {
  static?:
    | readonly unknown[]
    | ((
        column: SpreadsheetColumnBuilder<TContext>,
        group: SpreadsheetGroupBuilder,
      ) => readonly unknown[])
  dynamic?: (params: {
    dynamic: SpreadsheetDynamicBuilder<TContext>
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
