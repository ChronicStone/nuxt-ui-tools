import type { UseQueryOptions } from '@tanstack/vue-query'

import type {
  TableFilterOperator,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
} from './query-state'
import type { GenericObject, RenderableType, TableFieldPath, TableKnownFieldPath } from './utils'

export interface TableSearchFilter<TRow extends GenericObject = GenericObject> {
  fields: TableFieldPath<TRow>[]
  placeholder?: string
  debounce?: number
}

export interface TableStaticFilterRule<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  key: TKey
  operator: TableFilterOperator
  value: unknown | ((context: TContext) => unknown)
}

export interface TableResolvedFilterCondition<TKey extends string = string, TValue = unknown> {
  type: 'condition'
  key: TKey
  operator: TableFilterOperator
  value: TValue
}

export interface TableResolvedFilterGroup<TKey extends string = string> {
  type: 'group'
  combinator: 'and' | 'or'
  children: TableResolvedFilterNode<TKey>[]
}

export type TableResolvedFilterNode<TKey extends string = string> =
  | TableResolvedFilterCondition<TKey>
  | TableResolvedFilterGroup<TKey>

export type TableStaticFilterNode<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = TableStaticFilterRule<TRow, TContext, TKey> | TableResolvedFilterGroup<TKey>

export interface TableFilterResolveContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  rule: TableQueryStateFilterRule<TKey, TableFilterOperator, TableQueryStateFilterValue>
  definition: TableUiFilterDefinition<TRow, TContext, TKey>
  context?: TContext
}

export type TableFilterResolveResult<TKey extends string = string> =
  TableResolvedFilterNode<TKey> | null

interface TableFilterDefinitionBase<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = unknown,
> {
  key: TKey
  label: string | (() => RenderableType)
  defaultValue?: TValue
  defaultOperator?: TableFilterOperator
  operators?: TableFilterOperator[]
  resolve?: (
    params: TableFilterResolveContext<TRow, TContext, TKey>,
  ) => TableFilterResolveResult<string>
}

export interface TableTextFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, string> {
  kind: 'text'
}

export interface TableOptionFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = string | number | boolean,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, TValue[]> {
  kind: 'option'
  options:
    | Array<{ label: string | (() => RenderableType); value: TValue }>
    | {
        query: () => UseQueryOptions<
          Array<{ label: string | (() => RenderableType); value: TValue }>
        >
      }
}

export interface TableBooleanFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, boolean> {
  kind: 'boolean'
}

export interface TableNumberFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, number | { min?: number; max?: number }> {
  kind: 'number'
}

export interface TableDateFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, Date | { from?: Date; to?: Date }> {
  kind: 'date'
}

export type TableUiFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> =
  | TableTextFilterDefinition<TRow, TContext, TKey>
  | TableOptionFilterDefinition<TRow, TContext, TKey, any>
  | TableBooleanFilterDefinition<TRow, TContext, TKey>
  | TableNumberFilterDefinition<TRow, TContext, TKey>
  | TableDateFilterDefinition<TRow, TContext, TKey>

export type { TableFilterOperator }

export type TableTextFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableTextFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export type TableOptionFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = string | number | boolean,
> = Omit<TableOptionFilterDefinition<TRow, TContext, TKey, TValue>, 'key' | 'kind'>

export type TableBooleanFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableBooleanFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export type TableNumberFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableNumberFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export type TableDateFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableDateFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export interface TableFilterBuilder<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
> {
  text<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableTextFilterOptions<TRow, TContext, TKey>,
  ): TableTextFilterDefinition<TRow, TContext, TKey>
  option<TKey extends TableKnownFieldPath<TRow>, TValue extends string | number | boolean>(
    key: TKey,
    options: TableOptionFilterOptions<TRow, TContext, TKey, TValue>,
  ): TableOptionFilterDefinition<TRow, TContext, TKey, TValue>
  boolean<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableBooleanFilterOptions<TRow, TContext, TKey>,
  ): TableBooleanFilterDefinition<TRow, TContext, TKey>
  number<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableNumberFilterOptions<TRow, TContext, TKey>,
  ): TableNumberFilterDefinition<TRow, TContext, TKey>
  date<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableDateFilterOptions<TRow, TContext, TKey>,
  ): TableDateFilterDefinition<TRow, TContext, TKey>
}

export type TableUiFilterCollection<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> =
  | TableUiFilterDefinition<TRow, TContext, any>[]
  | ((
      filter: TableFilterBuilder<TRow, TContext>,
    ) => TableUiFilterDefinition<TRow, TContext, any>[])

export interface TableFiltersSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  search?: TableSearchFilter<TRow>
  static?: TableStaticFilterNode<TRow, TContext, TKey>[]
  ui?: TableUiFilterCollection<TRow, TContext, TKey>
}
