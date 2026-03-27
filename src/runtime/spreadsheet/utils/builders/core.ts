import type {
  InferSpreadsheetOptionValue,
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
  SpreadsheetResolvedColumns,
  SpreadsheetBuildRowDefinition,
  SpreadsheetFieldRulesInput,
  SpreadsheetModifier,
  SpreadsheetOptionItem,
} from '../../types'
import { resolveSpreadsheetRules } from '../validation'

function resolveSpreadsheetColumnOptions<
  TContext,
  TValue,
  TRequired extends boolean,
  TMultiple,
>(
  options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, TMultiple>,
) {
  return {
    ...options,
    rules: resolveSpreadsheetRules(options.rules),
  }
}

export function createSpreadsheetColumnBuilder<
  TContext = unknown,
>(): SpreadsheetColumnBuilder<TContext> {
  const enumColumn: SpreadsheetColumnBuilder<TContext>['enum'] = (
    key,
    options,
  ) => {
    const rules = resolveSpreadsheetRules(options.rules)

    return {
      kind: 'enum',
      key,
      label: options.label,
      required: options.required,
      match: options.match,
      from: options.from,
      multiple: options.multiple,
      parse: options.parse,
      options: options.options,
      rules,
    }
  }

  return {
    text<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      return {
        kind: 'text',
        key,
        ...resolveSpreadsheetColumnOptions(options),
      }
    },
    email<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      return {
        kind: 'email',
        key,
        ...resolveSpreadsheetColumnOptions(options),
      }
    },
    number<
      TKey extends string,
      TValue = number,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      return {
        kind: 'number',
        key,
        ...resolveSpreadsheetColumnOptions(options),
      }
    },
    date<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      return {
        kind: 'date',
        key,
        ...resolveSpreadsheetColumnOptions(options),
      }
    },
    boolean<
      TKey extends string,
      TValue = boolean,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined = SpreadsheetFieldRulesInput<TValue> | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<TContext, TValue, TRequired, Exclude<TMultiple, undefined>> & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      return {
        kind: 'boolean',
        key,
        ...resolveSpreadsheetColumnOptions(options),
      }
    },
    enum: enumColumn,
    option<
      TKey extends string,
      const TOption extends SpreadsheetOptionItem,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetOptionColumnMultipleOptions | undefined = undefined,
      TParse extends
        | SpreadsheetColumnBaseOptions<
          TContext,
          InferSpreadsheetOptionValue<TOption>,
          TRequired,
          Exclude<TMultiple, undefined>
        >['parse']
        | undefined = undefined,
      TResolvedValue = TParse extends (...args: infer _Args) => infer TResult
        ? Awaited<TResult>
        : InferSpreadsheetOptionValue<TOption>,
      TRulesInput extends SpreadsheetFieldRulesInput<TResolvedValue> | undefined = SpreadsheetFieldRulesInput<TResolvedValue> | undefined,
    >(
      key: TKey,
      options: SpreadsheetOptionColumnOptions<TContext, TOption, TRequired, Exclude<TMultiple, undefined>, TResolvedValue> & { rules?: TRulesInput },
    ): SpreadsheetColumnDefinition<TKey, TResolvedValue, TRequired, TContext, TRulesInput> {
      return {
        kind: 'option',
        key,
        ...resolveSpreadsheetColumnOptions(options),
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
    const TOption extends SpreadsheetOptionItem,
  >(config: {
    from: readonly TOption[]
    mode: 'multiple'
    separator?: string
    matchBy: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, 'multiple'>
  function options<
    const TOption extends SpreadsheetOptionItem,
  >(config: {
    from: readonly TOption[]
    mode?: 'single'
    separator?: string
    matchBy: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, 'single'>
  function options<const TOption extends SpreadsheetOptionItem>(config: {
    from: readonly TOption[]
    mode?: 'single' | 'multiple'
    separator?: string
    matchBy: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, 'single' | 'multiple'> {
    if (config.mode === 'multiple')
      return {
        kind: 'options',
        from: config.from,
        mode: 'multiple',
        separator: config.separator,
        matchBy: config.matchBy,
        itemModifiers: config.itemModifiers,
      }

      return {
        kind: 'options',
        from: config.from,
        mode: 'single',
        separator: config.separator,
        matchBy: config.matchBy,
        itemModifiers: config.itemModifiers,
    }
  }

  const builder: SpreadsheetDynamicValueBuilder = {
    text(config = {}) {
      return {
        kind: 'text',
        modifiers: config.modifiers,
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
  TRow,
>(): SpreadsheetReferenceBuilder<TRow> {
  const builder: SpreadsheetReferenceBuilder<TRow> = {
    select(field, config) {
      return {
        kind: 'select',
        field,
        source: config.source,
        options: config.options,
        getOptions: config.getOptions,
        rules: resolveSpreadsheetRules(config.rules),
      }
    },
  }

  return builder
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
    | ((reference: SpreadsheetReferenceBuilder<TRow>) => TReferences)
    | undefined,
): references is (reference: SpreadsheetReferenceBuilder<TRow>) => TReferences {
  return typeof references === 'function'
}

export function resolveSpreadsheetReferences<TReferences>(
  references: TReferences,
): TReferences
export function resolveSpreadsheetReferences<TContext, TRow, TReferences>(
  references: ((reference: SpreadsheetReferenceBuilder<TRow>) => TReferences) | undefined,
): TReferences | undefined
export function resolveSpreadsheetReferences<TContext, TRow, TReferences>(
  references:
    | TReferences
    | ((reference: SpreadsheetReferenceBuilder<TRow>) => TReferences)
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
