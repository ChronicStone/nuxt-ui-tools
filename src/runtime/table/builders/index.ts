import type {
  GenericObject,
  TableBooleanFilterOptions,
  TableColumnBuilder,
  TableColumnCollection,
  TableCompositeColumnOptions,
  TableDateFilterOptions,
  TableDisplayColumnOptions,
  TableFieldColumnOptions,
  TableFilterBuilder,
  TableKnownFieldPath,
  TableNumberFilterOptions,
  TableOptionFilterOptions,
  TableSortKey,
  TableTextFilterOptions,
  TableUiFilterCollection,
  TableUiFilterDefinition,
} from '../types'

export function createTableColumnBuilder<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
>(): TableColumnBuilder<TRow, TContext, TPageContext, TSortKey> {
  return {
    field<TField extends TableKnownFieldPath<TRow>>(
      field: TField,
      options: TableFieldColumnOptions<TRow, TContext, TPageContext, TField> = {},
    ) {
      return {
        kind: 'field',
        key: field as Extract<TField, string>,
        field,
        ...options,
      }
    },
    composite<TKey extends string>(
      key: TKey,
      options: TableCompositeColumnOptions<TRow, TContext, TPageContext, TKey, TSortKey>,
    ) {
      return {
        kind: 'composite',
        key,
        ...options,
      }
    },
    display<TKey extends string>(
      key: TKey,
      options: TableDisplayColumnOptions<TRow, TContext, TPageContext, TKey>,
    ) {
      return {
        kind: 'display',
        key,
        ...options,
      }
    },
  }
}

export function createTableFilterBuilder<
  TRow extends GenericObject,
  TContext extends GenericObject = GenericObject,
>(): TableFilterBuilder<TRow, TContext> {
  return {
    text<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableTextFilterOptions<TRow, TContext, TKey>,
    ) {
      return {
        kind: 'text',
        key,
        ...options,
      }
    },
    option<
      TKey extends TableKnownFieldPath<TRow>,
      TValue extends string | number | boolean,
      TPresentation extends import('../types').TableOptionFilterPresentation = 'list',
    >(
      key: TKey,
      options: TableOptionFilterOptions<TRow, TContext, TKey, TValue, TPresentation>,
    ) {
      return {
        kind: 'option',
        key,
        ...options,
      }
    },
    boolean<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableBooleanFilterOptions<TRow, TContext, TKey>,
    ) {
      return {
        kind: 'boolean',
        key,
        ...options,
      }
    },
    number<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableNumberFilterOptions<TRow, TContext, TKey>,
    ) {
      return {
        kind: 'number',
        key,
        ...options,
      }
    },
    date<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableDateFilterOptions<TRow, TContext, TKey>,
    ) {
      return {
        kind: 'date',
        key,
        ...options,
      }
    },
  }
}

export function resolveCollection<TBuilder, TResult>(
  collection: TResult | ((builder: TBuilder) => TResult) | undefined,
  builder: TBuilder,
): TResult | undefined {
  if (!collection) {
    return undefined
  }

  if (typeof collection === 'function') {
    return (collection as (builder: TBuilder) => TResult)(builder)
  }

  return collection
}

export function resolveColumns<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
  TColumns extends
    | TableColumnCollection<TRow, TContext, TPageContext, string, TSortKey>
    | undefined = TableColumnCollection<TRow, TContext, TPageContext, string, TSortKey> | undefined,
>(columns: TColumns): TColumns extends (...args: never[]) => infer TResult ? TResult : TColumns {
  return resolveCollection(
    columns,
    createTableColumnBuilder<TRow, TContext, TPageContext, TSortKey>(),
  ) as TColumns extends (...args: never[]) => infer TResult ? TResult : TColumns
}

export function resolveUiFilters<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TKey extends string,
>(
  filters: TableUiFilterCollection<TRow, TContext, TKey> | undefined,
): TableUiFilterDefinition<TRow, TContext, TKey>[] | undefined {
  return resolveCollection(filters, createTableFilterBuilder<TRow, TContext>())
}

export type { TableSortKey }
