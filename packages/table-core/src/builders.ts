import type {
  GenericObject,
  TableColumnBuilder,
  TableColumnCollection,
  TableCompositeColumnOptions,
  TableDisplayColumnOptions,
  TableFieldColumnOptions,
  TableKnownFieldPath,
  TableSortKey,
} from './types'

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
  return resolveCollection(
    columns,
    createTableColumnBuilder<TRow, TContext, TPageContext, TView, TSortKey>(),
  ) as TColumns extends (...args: never[]) => infer TResult ? TResult : TColumns
}
