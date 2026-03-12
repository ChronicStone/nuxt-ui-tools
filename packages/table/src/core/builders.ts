import type {
  GenericObject,
  TableColumnBuilder,
  TableColumnCollection,
  TableCompositeColumnOptions,
  TableDisplayColumnOptions,
  TableFieldColumnOptions,
  TableKnownFieldPath,
  TableFilterBuilder,
  TableOptionFilterOptions,
  TableSortKey,
  TableTextFilterOptions,
  TableBooleanFilterOptions,
  TableNumberFilterOptions,
  TableDateFilterOptions,
  TableUiFilterCollection,
  TableUiFilterDefinition,
} from '@lib/types'

export function createTableColumnBuilder<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
  TView extends string,
  TSortKey extends string = TableSortKey<TRow>,
>(): TableColumnBuilder<TRow, TContext, TPageContext, TView, TSortKey> {
  return {
    field<TField extends TableKnownFieldPath<TRow>>(
      field: TField,
      options: TableFieldColumnOptions<
        TRow,
        TContext,
        TPageContext,
        TView,
        TField
      > = {},
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
      options: TableCompositeColumnOptions<TRow, TContext, TPageContext, TView, TKey, TSortKey>,
    ) {
      return {
        kind: 'composite',
        key,
        ...options,
      }
    },
    display<TKey extends string>(
      key: TKey,
      options: TableDisplayColumnOptions<TRow, TContext, TPageContext, TView, TKey>,
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
>(): TableFilterBuilder<TRow> {
  return {
    text<TKey extends TableKnownFieldPath<TRow>>(key: TKey, options: TableTextFilterOptions<TRow, TKey>) {
      return {
        kind: 'text',
        key,
        ...options,
      }
    },
    option<TKey extends TableKnownFieldPath<TRow>, TValue extends string | number | boolean>(
      key: TKey,
      options: TableOptionFilterOptions<TRow, TKey, TValue>,
    ) {
      return {
        kind: 'option',
        key,
        ...options,
      }
    },
    boolean<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableBooleanFilterOptions<TRow, TKey>,
    ) {
      return {
        kind: 'boolean',
        key,
        ...options,
      }
    },
    number<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableNumberFilterOptions<TRow, TKey>,
    ) {
      return {
        kind: 'number',
        key,
        ...options,
      }
    },
    date<TKey extends TableKnownFieldPath<TRow>>(
      key: TKey,
      options: TableDateFilterOptions<TRow, TKey>,
    ) {
      return {
        kind: 'date',
        key,
        ...options,
      }
    },
  }
}

export function resolveUiFilters<
  TRow extends GenericObject,
  TKey extends TableKnownFieldPath<TRow>,
>(
  filters: TableUiFilterCollection<TRow, TKey> | undefined,
): readonly TableUiFilterDefinition<TRow, TKey>[] | undefined {
  if (!filters) {
    return undefined
  }

  if (typeof filters === 'function') {
    return filters(createTableFilterBuilder<TRow>())
  }

  return filters
}

export function resolveColumns<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TPageContext extends GenericObject,
  TView extends string,
  TSortKey extends string = TableSortKey<TRow>,
  TColumns extends TableColumnCollection<TRow, TContext, TPageContext, TView, string, TSortKey> | undefined = TableColumnCollection<
    TRow,
    TContext,
    TPageContext,
    TView,
    string,
    TSortKey
  > | undefined,
>(
  columns: TColumns,
): TColumns extends (...args: never[]) => infer TResult ? TResult : TColumns {
  if (typeof columns === 'function') {
    return columns(
      createTableColumnBuilder<TRow, TContext, TPageContext, TView, TSortKey>(),
    ) as never
  }

  return columns as never
}
