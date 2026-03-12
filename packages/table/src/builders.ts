import { resolveCollection, resolveColumns } from '@nuxt-ui-tools/table-core'

import type {
  GenericObject,
  TableBooleanFilterOptions,
  TableDateFilterOptions,
  TableFilterBuilder,
  TableKnownFieldPath,
  TableNumberFilterOptions,
  TableOptionFilterOptions,
  TableSortKey,
  TableTextFilterOptions,
  TableUiFilterCollection,
  TableUiFilterDefinition,
} from './types'

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
  TKey extends string,
>(
  filters: TableUiFilterCollection<TRow, TKey> | undefined,
): readonly TableUiFilterDefinition<TRow, TKey>[] | undefined {
  return resolveCollection(filters, createTableFilterBuilder<TRow>())
}

export { resolveColumns }
export type { TableSortKey }
