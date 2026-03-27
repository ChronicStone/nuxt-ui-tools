import type { LazyTextValue, MaybePromise } from '#ui-tools/shared/types/utils'
import type {
  SpreadsheetCellValue,
  SpreadsheetMatchDefinition,
  SpreadsheetModifier,
} from './shared'
import type { SpreadsheetFieldRulesInput } from './validation'
import type {
  InferSpreadsheetOptionValue,
  InferSpreadsheetOptionsSourceValue,
  SpreadsheetOptionItem,
  SpreadsheetOptionsSource,
} from './options'
import type {
  SpreadsheetColumnResolveDefinition,
  SpreadsheetResolvedSelectionValue,
} from './resolution'

export interface SpreadsheetColumnDefinition<
  TKey extends string = string,
  TValue = unknown,
  TRequired extends boolean = boolean,
  TContext = unknown,
  TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = undefined,
  TSourceValue = TValue,
  TResolve = undefined,
> {
  kind: 'text' | 'email' | 'number' | 'date' | 'boolean' | 'enum' | 'option'
  key: TKey
  label?: LazyTextValue
  required?: TRequired
  match?: SpreadsheetMatchDefinition
  from?: string | RegExp | readonly (string | RegExp)[]
  modifiers?: readonly SpreadsheetModifier[]
  multiple?: boolean | {
    separator?: string
    matchBy?: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  }
  parse?: (params: {
    cell: SpreadsheetCellValue
    context: TContext
  }) => MaybePromise<TSourceValue>
  resolve?: TResolve
  rules?: SpreadsheetFieldRulesInput<TValue>
  __rulesInput?: TRulesInput
  __valueType?: TValue
  __sourceValueType?: TSourceValue
  __resolveType?: TResolve
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

type ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple> =
  TParse extends (...args: infer _Args) => infer TResult
    ? Awaited<TResult>
    : TMultiple extends false | undefined
      ? TDefault
      : TDefault[]

export interface SpreadsheetColumnMultipleOptions {
  separator?: string
  itemModifiers?: readonly SpreadsheetModifier[]
}

export interface SpreadsheetEnumColumnMultipleOptions extends SpreadsheetColumnMultipleOptions {}

export interface SpreadsheetOptionColumnMultipleOptions extends SpreadsheetColumnMultipleOptions {
  matchBy?: 'label' | 'value'
}

export interface SpreadsheetColumnBaseOptions<
  TContext,
  TSourceValue,
  TRequired extends boolean,
  TMultiple = boolean | SpreadsheetColumnMultipleOptions,
> {
  label?: LazyTextValue
  required?: TRequired
  match?: SpreadsheetMatchDefinition
  from?: string | RegExp | readonly (string | RegExp)[]
  modifiers?: readonly SpreadsheetModifier[]
  multiple?: TMultiple
  parse?: (params: {
    cell: SpreadsheetCellValue
    context: TContext
  }) => MaybePromise<TSourceValue>
  rules?: SpreadsheetFieldRulesInput<TSourceValue>
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
  TOption extends SpreadsheetOptionItem,
  TRequired extends boolean,
  TMultiple = boolean | SpreadsheetOptionColumnMultipleOptions,
  TResolvedValue = InferSpreadsheetOptionValue<TOption>,
> = SpreadsheetColumnBaseOptions<TContext, TResolvedValue, TRequired, TMultiple> & {
  options: SpreadsheetOptionsSource<{ context: TContext }, TOption>
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

export interface SpreadsheetResolvableScalarColumnBuilder<
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
    TSourceValue = ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple>,
    TRulesInput extends SpreadsheetFieldRulesInput<TSourceValue> | undefined = SpreadsheetFieldRulesInput<TSourceValue> | undefined,
  >(
    key: TKey,
    options?: Omit<
      SpreadsheetColumnBaseOptions<
        TContext,
        TSourceValue,
        TRequired,
        Exclude<TMultiple, undefined>
      >,
      'rules'
    > & {
      rules?: TRulesInput
    },
  ): SpreadsheetColumnDefinition<TKey, TSourceValue, TRequired, TContext, TRulesInput, TSourceValue>
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
    TSourceValue = ResolveSpreadsheetColumnValue<TDefault, TParse, TMultiple>,
    const TResolveOptions = readonly SpreadsheetOptionItem[],
    TResolveValue = SpreadsheetResolvedSelectionValue<
      TSourceValue,
      InferSpreadsheetOptionsSourceValue<TResolveOptions>
    >,
    TRulesInput extends SpreadsheetFieldRulesInput<TResolveValue> | undefined = SpreadsheetFieldRulesInput<TResolveValue> | undefined,
  >(
    key: TKey,
    options: Omit<
      SpreadsheetColumnBaseOptions<
        TContext,
        TSourceValue,
        TRequired,
        Exclude<TMultiple, undefined>
      >,
      'rules'
    > & {
      resolve: {
        options: TResolveOptions & SpreadsheetOptionsSource<{ context: TContext }, SpreadsheetOptionItem>
        getOptions?: SpreadsheetColumnResolveDefinition<
          TContext,
          TSourceValue,
          SpreadsheetOptionItem,
          TResolveValue
        >['getOptions']
      }
      rules?: TRulesInput
    },
  ): SpreadsheetColumnDefinition<
    TKey,
    TResolveValue,
    TRequired,
    TContext,
    TRulesInput,
    TSourceValue,
    SpreadsheetColumnResolveDefinition<
      TContext,
      TSourceValue,
      SpreadsheetOptionItem,
      TResolveValue
    >
  >
}

export interface SpreadsheetOptionColumnBuilder<TContext = unknown> {
  <
    TKey extends string,
    const TOption extends SpreadsheetOptionItem,
    TRequired extends boolean = false,
    TMultiple extends boolean | SpreadsheetOptionColumnMultipleOptions | undefined = undefined,
    TParse extends
      | SpreadsheetColumnBaseOptions<
        TContext,
        ResolveSpreadsheetColumnValue<InferSpreadsheetOptionValue<TOption>, undefined, TMultiple>,
        TRequired,
        Exclude<TMultiple, undefined>
      >['parse']
      | undefined = undefined,
    TRulesInput extends SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<InferSpreadsheetOptionValue<TOption>, TParse, TMultiple>> | undefined = SpreadsheetFieldRulesInput<ResolveSpreadsheetColumnValue<InferSpreadsheetOptionValue<TOption>, TParse, TMultiple>> | undefined,
  >(
    key: TKey,
    options: SpreadsheetColumnBaseOptions<
      TContext,
      ResolveSpreadsheetColumnValue<InferSpreadsheetOptionValue<TOption>, TParse, TMultiple>,
      TRequired,
      Exclude<TMultiple, undefined>
    > & {
      rules?: TRulesInput
      options: SpreadsheetOptionsSource<{ context: TContext }, TOption>
    },
  ): SpreadsheetColumnDefinition<TKey, ResolveSpreadsheetColumnValue<InferSpreadsheetOptionValue<TOption>, TParse, TMultiple>, TRequired, TContext, TRulesInput>
}

export interface SpreadsheetColumnBuilder<TContext = unknown> {
  text: SpreadsheetResolvableScalarColumnBuilder<TContext, string>
  email: SpreadsheetScalarColumnBuilder<TContext, string>
  number: SpreadsheetResolvableScalarColumnBuilder<TContext, number>
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
  modifiers?: readonly SpreadsheetModifier[]
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

export interface SpreadsheetDynamicOptionsValueDefinition<
  TOption extends SpreadsheetOptionItem = SpreadsheetOptionItem,
  TMode extends 'single' | 'multiple' = 'single',
> {
  kind: 'options'
  from: readonly TOption[]
  mode: TMode
  separator?: string
  matchBy: 'label' | 'value'
  itemModifiers?: readonly SpreadsheetModifier[]
}

export type SpreadsheetDynamicValueDefinition =
  | SpreadsheetDynamicTextValueDefinition
  | SpreadsheetDynamicNumberValueDefinition
  | SpreadsheetDynamicDateValueDefinition
  | SpreadsheetDynamicBooleanValueDefinition
  | SpreadsheetDynamicOptionsValueDefinition<SpreadsheetOptionItem, 'single' | 'multiple'>

type SpreadsheetDynamicResolvedValue<TValueDefinition> =
  TValueDefinition extends SpreadsheetDynamicTextValueDefinition ? string
    : TValueDefinition extends SpreadsheetDynamicNumberValueDefinition ? number
      : TValueDefinition extends SpreadsheetDynamicDateValueDefinition ? string
        : TValueDefinition extends SpreadsheetDynamicBooleanValueDefinition ? boolean
          : TValueDefinition extends SpreadsheetDynamicOptionsValueDefinition<infer TOption, infer TMode>
            ? TMode extends 'multiple'
              ? InferSpreadsheetOptionValue<TOption>[]
              : InferSpreadsheetOptionValue<TOption>
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
    modifiers?: readonly SpreadsheetModifier[]
  }) => SpreadsheetDynamicTextValueDefinition
  number: () => SpreadsheetDynamicNumberValueDefinition
  date: () => SpreadsheetDynamicDateValueDefinition
  boolean: () => SpreadsheetDynamicBooleanValueDefinition
  options<
    const TOption extends SpreadsheetOptionItem,
    TMode extends 'single' | 'multiple' = 'single',
  >(
    config: {
    from: readonly TOption[]
    mode?: TMode
    separator?: string
    matchBy: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  },
  ): SpreadsheetDynamicOptionsValueDefinition<TOption, TMode>
}

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
  }
  options?:
    | readonly SpreadsheetOptionItem<TValue>[]
    | SpreadsheetDynamicCollectionCallback<unknown, readonly SpreadsheetOptionItem<TValue>[]>
  values?: {
    mode: 'single' | 'csv'
    separator?: string
    resolve: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  }
  output: {
    into: TInto
  }
  __valueType?: TValue
}

export type SpreadsheetBuiltDynamicOptionGroupsDefinition<
  TKey extends string,
  TSource extends readonly unknown[],
  TOption extends SpreadsheetOptionItem,
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
  }
  options: readonly TOption[] | ((item: ArrayElement<TSource>) => readonly TOption[])
  values: {
    mode: 'single' | 'csv'
    separator?: string
    resolve: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
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
    const TOption extends SpreadsheetOptionItem,
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
    }
    options: readonly TOption[] | ((item: ArrayElement<TSource>) => readonly TOption[])
    values: {
      mode: 'single' | 'csv'
      separator?: string
      resolve: 'label' | 'value'
      itemModifiers?: readonly SpreadsheetModifier[]
    }
    output: {
      into: TInto
    }
  }) => SpreadsheetBuiltDynamicOptionGroupsDefinition<TKey, TSource, TOption, InferSpreadsheetOptionValue<TOption>, TInto>
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
