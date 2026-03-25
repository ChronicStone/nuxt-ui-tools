import type {
  SpreadsheetColumnBaseOptions,
  SpreadsheetColumnBuilder,
  SpreadsheetColumnDefinition,
  SpreadsheetColumnsDefinition,
  SpreadsheetDynamicBuilder,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetEnumColumnOptions,
  SpreadsheetGroupBuilder,
  SpreadsheetOptionColumnOptions,
  SpreadsheetPipelineDefinition,
  SpreadsheetReferenceDefinition,
  SpreadsheetResolvedColumns,
} from '../../types'

export function createSpreadsheetColumnBuilder<
  TContext = unknown,
>(): SpreadsheetColumnBuilder<TContext> {
  return {
    text<TKey extends string, TValue = string, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'text',
        key,
        ...options,
      }
    },
    email<TKey extends string, TValue = string, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'email',
        key,
        ...options,
      }
    },
    number<TKey extends string, TValue = number, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'number',
        key,
        ...options,
      }
    },
    date<TKey extends string, TValue = string, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'date',
        key,
        ...options,
      }
    },
    boolean<TKey extends string, TValue = boolean, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'boolean',
        key,
        ...options,
      }
    },
    enum<TKey extends string, TValue, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetEnumColumnOptions<TContext, TValue, TRequired>,
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'enum',
        key,
        ...options,
      }
    },
    option<TKey extends string, TOption, TValue, TRequired extends boolean = false>(
      key: TKey,
      options: SpreadsheetOptionColumnOptions<TContext, TOption, TValue, TRequired>,
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'option',
        key,
        ...options,
      }
    },
  }
}

export function createSpreadsheetGroupBuilder(): SpreadsheetGroupBuilder {
  return (key, columns) => ({
    kind: 'group',
    key,
    columns,
  })
}

export function createSpreadsheetDynamicBuilder(): SpreadsheetDynamicBuilder {
  return {
    optionGroups(config) {
      return {
        kind: 'option-groups',
        key: config.key,
        source: config.source,
        itemKey: config.itemKey,
        itemLabel: config.itemLabel,
        targetKey: config.targetKey,
        header: config.header,
        options: config.options,
        values: config.values,
        output: config.output,
      }
    },
  }
}

export function defineSpreadsheetColumns<
  TContext,
  const TColumns extends {
    static?: unknown
    dynamic?: unknown
  },
>(columns: TColumns & SpreadsheetColumnsDefinition<TContext>): TColumns {
  return columns
}

export function defineSpreadsheetReference<
  TContext,
  TRow,
  const TOutputField extends string,
  TValue,
  TOption,
  const TDefinition extends {
    key: string
    sourceField: string
    target: unknown
    output: {
      field: TOutputField
    }
  },
>(
  definition: TDefinition & SpreadsheetReferenceDefinition<
    TContext,
    TRow,
    TOutputField,
    TValue,
    TOption
  >,
): TDefinition & SpreadsheetReferenceDefinition<
  TContext,
  TRow,
  TOutputField,
  TValue,
  TOption
> {
  return definition
}

export function defineSpreadsheetReferences<
  const TReferences extends readonly unknown[],
>(references: TReferences): TReferences {
  return references
}

export function defineSpreadsheetPipeline<
  TContext,
  TRow,
  const TPipeline extends {
    submit?: unknown
  },
>(pipeline: TPipeline & SpreadsheetPipelineDefinition<TContext, TRow>): TPipeline {
  return pipeline
}

function isCollectionResolver<TBuilderTuple extends readonly unknown[], TResult>(
  collection: TResult | ((...builders: TBuilderTuple) => TResult),
): collection is (...builders: TBuilderTuple) => TResult {
  return typeof collection === 'function'
}

export function resolveCollection<TBuilderTuple extends readonly unknown[], TResult>(
  collection: (...builders: TBuilderTuple) => TResult,
  ...builders: TBuilderTuple
): TResult
export function resolveCollection<TBuilderTuple extends readonly unknown[], TResult>(
  collection: TResult,
  ...builders: TBuilderTuple
): TResult
export function resolveCollection<TBuilderTuple extends readonly unknown[], TResult>(
  collection: TResult | ((...builders: TBuilderTuple) => TResult) | undefined,
  ...builders: TBuilderTuple
): TResult | undefined {
  if (!collection) return undefined
  if (isCollectionResolver(collection)) return collection(...builders)
  return collection
}

export function resolveSpreadsheetColumns<TColumns>(
  columns: TColumns,
): TColumns extends SpreadsheetColumnsDefinition<any> ? SpreadsheetResolvedColumns<TColumns> : TColumns
export function resolveSpreadsheetColumns(
  columns: SpreadsheetColumnsDefinition | undefined,
) {
  if (!columns || typeof columns !== 'object') return columns

  const staticColumns = 'static' in columns
    ? resolveCollection(
        columns.static,
        createSpreadsheetColumnBuilder(),
        createSpreadsheetGroupBuilder(),
      )
    : undefined

  const dynamicColumns = 'dynamic' in columns
    ? columns.dynamic
    : undefined

  return {
    ...columns,
    static: staticColumns,
    dynamic: dynamicColumns,
  }
}
