import type {
  SpreadsheetColumnBaseOptions,
  SpreadsheetColumnBuilder,
  SpreadsheetColumnDefinition,
  SpreadsheetColumnMultipleOptions,
  SpreadsheetColumnsDefinition,
  SpreadsheetDynamicBuilder,
  SpreadsheetDynamicOptionsValueDefinition,
  SpreadsheetDynamicValueBuilder,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetEnumColumnMultipleOptions,
  SpreadsheetEnumColumnOptions,
  SpreadsheetGroupBuilder,
  SpreadsheetOptionColumnMultipleOptions,
  SpreadsheetOptionColumnOptions,
  SpreadsheetReferenceBuilder,
  SpreadsheetReferenceDefinition,
  SpreadsheetReferenceSelectConfig,
  SpreadsheetReferenceValue,
  SpreadsheetResolvedColumns,
  SpreadsheetBuildRowDefinition,
} from '../../types'

export function createSpreadsheetColumnBuilder<
  TContext = unknown,
>(): SpreadsheetColumnBuilder<TContext> {
  return {
    text<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'text',
        key,
        ...options,
      }
    },
    email<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'email',
        key,
        ...options,
      }
    },
    number<
      TKey extends string,
      TValue = number,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'number',
        key,
        ...options,
      }
    },
    date<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'date',
        key,
        ...options,
      }
    },
    boolean<
      TKey extends string,
      TValue = boolean,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'boolean',
        key,
        ...options,
      }
    },
    enum<
      TKey extends string,
      TValue,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetEnumColumnMultipleOptions | undefined = undefined,
    >(
      key: TKey,
      options: SpreadsheetEnumColumnOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>>,
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext> {
      return {
        kind: 'enum',
        key,
        ...options,
      }
    },
    option<
      TKey extends string,
      TOption,
      TValue,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetOptionColumnMultipleOptions | undefined = undefined,
      TResolvedValue = TValue,
    >(
      key: TKey,
      options: SpreadsheetOptionColumnOptions<TContext, TOption, TValue, TRequired, Exclude<TMultiple, undefined>, TResolvedValue>,
    ): SpreadsheetColumnDefinition<TKey, TResolvedValue, TRequired, TContext> {
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

function createSpreadsheetDynamicValueBuilder(): SpreadsheetDynamicValueBuilder {
  function options<
    TOption,
    TValue = TOption extends { value: infer TResolvedValue }
      ? TResolvedValue
      : never,
  >(config: {
    from: readonly TOption[]
    optionLabel?: (option: TOption) => string
    optionValue?: (option: TOption) => TValue
    mode: 'multiple'
    separator?: string
    matchBy: 'label' | 'value'
    normalize?: readonly string[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, TValue, 'multiple'>
  function options<
    TOption,
    TValue = TOption extends { value: infer TResolvedValue }
      ? TResolvedValue
      : never,
  >(config: {
    from: readonly TOption[]
    optionLabel?: (option: TOption) => string
    optionValue?: (option: TOption) => TValue
    mode?: 'single'
    separator?: string
    matchBy: 'label' | 'value'
    normalize?: readonly string[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, TValue, 'single'>
  function options<TOption, TValue>(config: {
    from: readonly TOption[]
    optionLabel?: (option: TOption) => string
    optionValue?: (option: TOption) => TValue
    mode?: 'single' | 'multiple'
    separator?: string
    matchBy: 'label' | 'value'
    normalize?: readonly string[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, TValue, 'single' | 'multiple'> {
    if (config.mode === 'multiple')
      return {
        kind: 'options',
        from: config.from,
        optionLabel: config.optionLabel,
        optionValue: config.optionValue,
        mode: 'multiple',
        separator: config.separator,
        matchBy: config.matchBy,
        normalize: config.normalize,
      }

      return {
        kind: 'options',
        from: config.from,
        optionLabel: config.optionLabel,
        optionValue: config.optionValue,
        mode: 'single',
        separator: config.separator,
        matchBy: config.matchBy,
        normalize: config.normalize,
    }
  }

  const builder: SpreadsheetDynamicValueBuilder = {
    text(config = {}) {
      return {
        kind: 'text',
        normalize: config.normalize,
      }
    },
    number() {
      return {
        kind: 'number',
      }
    },
    date() {
      return {
        kind: 'date',
      }
    },
    boolean() {
      return {
        kind: 'boolean',
      }
    },
    options,
  }

  return builder
}

function isSpreadsheetDynamicValueResolver<TValueDefinition>(
  definition: TValueDefinition | ((value: SpreadsheetDynamicValueBuilder) => TValueDefinition),
): definition is (value: SpreadsheetDynamicValueBuilder) => TValueDefinition {
  return typeof definition === 'function'
}

function buildSpreadsheetCollectionItems<
  TContext,
  TSource extends readonly unknown[],
  TItem,
>(params: {
  context: TContext
  from: (params: { context: TContext }) => TSource
  each: (source: TSource[number]) => TItem
  resolveValue: (item: TItem) => unknown
}) {
  return params.from({ context: params.context }).map((source) => {
    const item = params.each(source)
    return {
      ...item,
      value: params.resolveValue(item),
      source,
    }
  })
}

export function createSpreadsheetDynamicBuilder<TContext>(
  context: TContext,
): SpreadsheetDynamicBuilder<TContext>
export function createSpreadsheetDynamicBuilder<TContext>(
  context: TContext,
): SpreadsheetDynamicBuilder<TContext> {
  function resolveDynamicCollectionValue<TValueDefinition>(
    definition: TValueDefinition | ((value: SpreadsheetDynamicValueBuilder) => TValueDefinition),
  ) {
    if (isSpreadsheetDynamicValueResolver(definition))
      return definition(createSpreadsheetDynamicValueBuilder())

    return definition
  }

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
    arrayFromCollection(rootKey, config) {
      const items = buildSpreadsheetCollectionItems({
        context,
        from: config.from,
        each: config.each,
        resolveValue: item => resolveDynamicCollectionValue(item.value),
      })

      return {
        kind: 'collection',
        rootKey,
        as: 'array',
        items,
      }
    },
    recordFromCollection(rootKey, config) {
      const items = buildSpreadsheetCollectionItems({
        context,
        from: config.from,
        each: config.each,
        resolveValue: item => resolveDynamicCollectionValue(item.value),
      })

      return {
        kind: 'collection',
        rootKey,
        as: 'record',
        items,
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

export function createSpreadsheetReferenceBuilder<
  _TContext,
  _TRow,
>(): SpreadsheetReferenceBuilder {
  function select<
    TField extends string,
    const TOption,
    TValue = TOption extends { value: infer TResolvedValue }
      ? TResolvedValue
      : unknown,
  >(
    field: TField,
    config: SpreadsheetReferenceSelectConfig<TOption, TValue>,
  ): SpreadsheetReferenceDefinition<
    TField,
    SpreadsheetReferenceValue<TOption, TValue>,
    TOption
  > {
    if (config.optionValue && config.optionLabel) {
      return {
        kind: 'select',
        field,
        source: config.source,
        options: config.options,
        getOptions: config.getOptions,
        optionValue: config.optionValue,
        optionLabel: config.optionLabel,
      }
    }

    return {
      kind: 'select',
      field,
      source: config.source,
      options: config.options,
      getOptions: config.getOptions,
    }
  }

  return {
    select,
  }
}

export function defineSpreadsheetReference<
  const TDefinition extends SpreadsheetReferenceDefinition,
>(
  definition: TDefinition,
): TDefinition {
  return definition
}

export function defineSpreadsheetReferences<
  const TReferences extends readonly unknown[],
>(references: TReferences): TReferences {
  return references
}

export function defineSpreadsheetBuildRow<
  TContext,
  TRow,
  const TBuildRow extends SpreadsheetBuildRowDefinition<TContext, TRow>,
>(buildRow: TBuildRow): TBuildRow {
  return buildRow
}

function isSpreadsheetReferenceResolver<TContext, TRow, TReferences>(
  references:
    | TReferences
    | ((reference: SpreadsheetReferenceBuilder) => TReferences)
    | undefined,
): references is (reference: SpreadsheetReferenceBuilder) => TReferences {
  return typeof references === 'function'
}

export function resolveSpreadsheetReferences<TReferences>(
  references: TReferences,
): TReferences
export function resolveSpreadsheetReferences<TContext, TRow, TReferences>(
  references: ((reference: SpreadsheetReferenceBuilder) => TReferences) | undefined,
): TReferences | undefined
export function resolveSpreadsheetReferences<TContext, TRow, TReferences>(
  references:
    | TReferences
    | ((reference: SpreadsheetReferenceBuilder) => TReferences)
    | undefined,
) {
  if (!references) return undefined
  if (isSpreadsheetReferenceResolver<TContext, TRow, TReferences>(references))
    return references(createSpreadsheetReferenceBuilder<TContext, TRow>())

  return references
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

  return {
    ...columns,
    static: staticColumns,
  }
}
