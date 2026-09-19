import { isFunction, isObject } from '#ui-tools/shared/utils/predicate'

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
  SpreadsheetValue,
} from '../../types'
import { resolveSpreadsheetRules } from '../validation'

export function createSpreadsheetColumnBuilder<
  TContext = unknown,
>(): SpreadsheetColumnBuilder<TContext> {
  const textColumn: SpreadsheetColumnBuilder<TContext>['text'] = (
    key: string,
    options: { rules?: SpreadsheetFieldRulesInput<unknown> } = {},
  ) => {
    const rules = resolveSpreadsheetRules(options.rules)

    return {
      kind: 'text' as const,
      key,
      ...options,
      rules,
    }
  }

  const enumColumn: SpreadsheetColumnBuilder<TContext>['enum'] = (key, options) => {
    const rules = resolveSpreadsheetRules(options.rules)

    return {
      from: options.from,
      key,
      kind: 'enum',
      label: options.label,
      match: options.match,
      multiple: options.multiple,
      options: options.options,
      parse: options.parse,
      required: options.required,
      rules,
    }
  }

  const numberColumn: SpreadsheetColumnBuilder<TContext>['number'] = (
    key: string,
    options: { rules?: SpreadsheetFieldRulesInput<unknown> } = {},
  ) => {
    const rules = resolveSpreadsheetRules(options.rules)

    return {
      kind: 'number' as const,
      key,
      ...options,
      rules,
    }
  }

  return {
    boolean<
      TKey extends string,
      TValue = boolean,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined =
        | SpreadsheetFieldRulesInput<TValue>
        | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<
        TContext,
        TValue,
        TRequired,
        Exclude<TMultiple, undefined>
      > & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      const rules = resolveSpreadsheetRules(options.rules)

      return {
        kind: 'boolean',
        key,
        ...options,
        rules,
      }
    },
    date<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined =
        | SpreadsheetFieldRulesInput<TValue>
        | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<
        TContext,
        TValue,
        TRequired,
        Exclude<TMultiple, undefined>
      > & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      const rules = resolveSpreadsheetRules(options.rules)

      return {
        kind: 'date',
        key,
        ...options,
        rules,
      }
    },
    email<
      TKey extends string,
      TValue = string,
      TRequired extends boolean = false,
      TMultiple extends boolean | SpreadsheetColumnMultipleOptions | undefined = undefined,
      TRulesInput extends SpreadsheetFieldRulesInput<TValue> | undefined =
        | SpreadsheetFieldRulesInput<TValue>
        | undefined,
    >(
      key: TKey,
      options: SpreadsheetColumnBaseOptions<
        TContext,
        TValue,
        TRequired,
        Exclude<TMultiple, undefined>
      > & { rules?: TRulesInput } = {},
    ): SpreadsheetColumnDefinition<TKey, TValue, TRequired, TContext, TRulesInput> {
      const rules = resolveSpreadsheetRules(options.rules)

      return {
        kind: 'email',
        key,
        ...options,
        rules,
      }
    },
    enum: enumColumn,
    number: numberColumn,
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
      TRulesInput extends SpreadsheetFieldRulesInput<TResolvedValue> | undefined =
        | SpreadsheetFieldRulesInput<TResolvedValue>
        | undefined,
    >(
      key: TKey,
      options: SpreadsheetOptionColumnOptions<
        TContext,
        TOption,
        TRequired,
        Exclude<TMultiple, undefined>,
        TResolvedValue
      > & { rules?: TRulesInput },
    ): SpreadsheetColumnDefinition<TKey, TResolvedValue, TRequired, TContext, TRulesInput> {
      const rules = resolveSpreadsheetRules(options.rules)

      return {
        kind: 'option',
        key,
        ...options,
        rules,
      }
    },
    text: textColumn,
  }
}

export function createSpreadsheetGroupBuilder(): SpreadsheetGroupBuilder {
  return (key, columns) => ({
    columns,
    key,
    kind: 'group',
  })
}

function createSpreadsheetDynamicValueBuilder(): SpreadsheetDynamicValueBuilder {
  function options<const TOption extends SpreadsheetOptionItem>(config: {
    from: readonly TOption[]
    mode: 'multiple'
    separator?: string
    matchBy: 'label' | 'value'
    itemModifiers?: readonly SpreadsheetModifier[]
  }): SpreadsheetDynamicOptionsValueDefinition<TOption, 'multiple'>
  function options<const TOption extends SpreadsheetOptionItem>(config: {
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
    if (config.mode === 'multiple') {
      return {
        from: config.from,
        itemModifiers: config.itemModifiers,
        kind: 'options',
        matchBy: config.matchBy,
        mode: 'multiple',
        separator: config.separator,
      }
    }

    return {
      from: config.from,
      itemModifiers: config.itemModifiers,
      kind: 'options',
      matchBy: config.matchBy,
      mode: 'single',
      separator: config.separator,
    }
  }

  const builder: SpreadsheetDynamicValueBuilder = {
    boolean() {
      return {
        kind: 'boolean',
      }
    },
    date() {
      return {
        kind: 'date',
      }
    },
    number() {
      return {
        kind: 'number',
      }
    },
    options,
    text(config = {}) {
      return {
        kind: 'text',
        modifiers: config.modifiers,
      }
    },
  }

  return builder
}

function isSpreadsheetDynamicValueResolver<TValueDefinition>(
  definition: TValueDefinition | ((value: SpreadsheetDynamicValueBuilder) => TValueDefinition),
): definition is (value: SpreadsheetDynamicValueBuilder) => TValueDefinition {
  return isFunction(definition)
}

function buildSpreadsheetCollectionItems<
  TContext,
  TSource extends readonly unknown[],
  TItem,
>(params: {
  context: TContext
  from: (params: { context: TContext }) => TSource
  each: (source: TSource[number]) => TItem
  resolveValue: (item: TItem) => SpreadsheetValue
}) {
  return params.from({ context: params.context }).map((source) => {
    const item = params.each(source)
    return {
      ...item,
      source,
      value: params.resolveValue(item),
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
    if (isSpreadsheetDynamicValueResolver(definition)) {
      return definition(createSpreadsheetDynamicValueBuilder())
    }

    return definition
  }

  return {
    arrayFromCollection(rootKey, config) {
      const items = buildSpreadsheetCollectionItems({
        context,
        each: config.each,
        from: config.from,
        resolveValue: (item) => resolveDynamicCollectionValue(item.value),
      })

      return {
        as: 'array',
        items,
        kind: 'collection',
        rootKey,
      }
    },
    optionGroups(config) {
      return {
        header: config.header,
        itemKey: config.itemKey,
        itemLabel: config.itemLabel,
        key: config.key,
        kind: 'option-groups',
        options: config.options,
        output: config.output,
        source: config.source,
        targetKey: config.targetKey,
        values: config.values,
      }
    },
    recordFromCollection(rootKey, config) {
      const items = buildSpreadsheetCollectionItems({
        context,
        each: config.each,
        from: config.from,
        resolveValue: (item) => resolveDynamicCollectionValue(item.value),
      })

      return {
        as: 'record',
        items,
        kind: 'collection',
        rootKey,
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
        field,
        getOptions: config.getOptions,
        kind: 'select',
        options: config.options,
        rules: resolveSpreadsheetRules(config.rules),
        source: config.source,
      }
    },
  }

  return builder
}

export function defineSpreadsheetReference<
  const TDefinition extends SpreadsheetReferenceDefinition,
>(definition: TDefinition): TDefinition {
  return definition
}

export function defineSpreadsheetReferences<const TReferences extends readonly unknown[]>(
  references: TReferences,
): TReferences {
  return references
}

export function defineSpreadsheetBuildRow<
  TContext,
  TRow,
  const TBuildRow extends SpreadsheetBuildRowDefinition<TContext, TRow>,
>(buildRow: TBuildRow): TBuildRow {
  return buildRow
}

function isSpreadsheetReferenceResolver<TRow, TReferences>(
  references:
    | TReferences
    | ((reference: SpreadsheetReferenceBuilder<TRow>) => TReferences)
    | undefined,
): references is (reference: SpreadsheetReferenceBuilder<TRow>) => TReferences {
  return isFunction(references)
}

export function resolveSpreadsheetReferences<TReferences>(references: TReferences): TReferences
export function resolveSpreadsheetReferences<TRow, TReferences>(
  references: ((reference: SpreadsheetReferenceBuilder<TRow>) => TReferences) | undefined,
): TReferences | undefined
export function resolveSpreadsheetReferences<TRow, TReferences>(
  references:
    | TReferences
    | ((reference: SpreadsheetReferenceBuilder<TRow>) => TReferences)
    | undefined,
) {
  if (!references) {
    return
  }
  if (isSpreadsheetReferenceResolver<TRow, TReferences>(references)) {
    return references(createSpreadsheetReferenceBuilder<unknown, TRow>())
  }

  return references
}

function isCollectionResolver<TBuilderTuple extends readonly unknown[], TResult>(
  collection: TResult | ((...builders: TBuilderTuple) => TResult),
): collection is (...builders: TBuilderTuple) => TResult {
  return isFunction(collection)
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
  if (!collection) {
    return undefined
  }
  if (isCollectionResolver(collection)) {
    return collection(...builders)
  }
  return collection
}

export function resolveSpreadsheetColumns<TColumns>(
  columns: TColumns,
): TColumns extends SpreadsheetColumnsDefinition<any>
  ? SpreadsheetResolvedColumns<TColumns>
  : TColumns
export function resolveSpreadsheetColumns(columns: SpreadsheetColumnsDefinition | undefined) {
  if (!columns || !isObject(columns)) {
    return columns
  }

  const staticColumns =
    'static' in columns
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
