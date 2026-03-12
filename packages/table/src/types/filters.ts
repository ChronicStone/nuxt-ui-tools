import type { GenericObject, RenderableType, TableFieldPath, TableKnownFieldPath } from './utils'

export type TableFilterOperator =
  | 'contains'
  | 'is'
  | 'isAnyOf'
  | 'isNot'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'before'
  | 'after'

export interface TableSearchFilter<TRow extends GenericObject = GenericObject> {
  fields: readonly TableFieldPath<TRow>[]
  placeholder?: string
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

interface TableFilterDefinitionBase<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = unknown,
> {
  key: TKey
  label: string | (() => RenderableType)
  defaultValue?: TValue
  operators?: readonly TableFilterOperator[]
}

export interface TableTextFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TKey, string> {
  kind: 'text'
}

export interface TableOptionFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = string | number | boolean,
> extends TableFilterDefinitionBase<TRow, TKey, readonly TValue[]> {
  kind: 'option'
  options:
    | readonly { label: string | (() => RenderableType); value: TValue }[]
    | {
        loader: () =>
          | Promise<readonly { label: string | (() => RenderableType); value: TValue }[]>
          | readonly { label: string | (() => RenderableType); value: TValue }[]
      }
}

export interface TableBooleanFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TKey, boolean> {
  kind: 'boolean'
}

export interface TableNumberFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TKey, number | { min?: number; max?: number }> {
  kind: 'number'
}

export interface TableDateFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TKey, Date | { from?: Date; to?: Date }> {
  kind: 'date'
}

export type TableUiFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> =
  | TableTextFilterDefinition<TRow, TKey>
  | TableOptionFilterDefinition<TRow, TKey>
  | TableBooleanFilterDefinition<TRow, TKey>
  | TableNumberFilterDefinition<TRow, TKey>
  | TableDateFilterDefinition<TRow, TKey>

export type TableTextFilterOptions<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableTextFilterDefinition<TRow, TKey>, 'key' | 'kind'>

export type TableOptionFilterOptions<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = string | number | boolean,
> = Omit<TableOptionFilterDefinition<TRow, TKey, TValue>, 'key' | 'kind'>

export type TableBooleanFilterOptions<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableBooleanFilterDefinition<TRow, TKey>, 'key' | 'kind'>

export type TableNumberFilterOptions<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableNumberFilterDefinition<TRow, TKey>, 'key' | 'kind'>

export type TableDateFilterOptions<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableDateFilterDefinition<TRow, TKey>, 'key' | 'kind'>

export interface TableFilterBuilder<TRow extends GenericObject = GenericObject> {
  text<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableTextFilterOptions<TRow, TKey>,
  ): TableTextFilterDefinition<TRow, TKey>
  option<TKey extends TableKnownFieldPath<TRow>, TValue extends string | number | boolean>(
    key: TKey,
    options: TableOptionFilterOptions<TRow, TKey, TValue>,
  ): TableOptionFilterDefinition<TRow, TKey, TValue>
  boolean<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableBooleanFilterOptions<TRow, TKey>,
  ): TableBooleanFilterDefinition<TRow, TKey>
  number<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableNumberFilterOptions<TRow, TKey>,
  ): TableNumberFilterDefinition<TRow, TKey>
  date<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableDateFilterOptions<TRow, TKey>,
  ): TableDateFilterDefinition<TRow, TKey>
}

export type TableUiFilterCollection<
  TRow extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> =
  | readonly TableUiFilterDefinition<TRow, TKey>[]
  | ((filter: TableFilterBuilder<TRow>) => readonly TableUiFilterDefinition<TRow, TKey>[])

export interface TableFiltersSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  search?: TableSearchFilter<TRow>
  static?: readonly TableStaticFilterRule<TRow, TContext, TKey>[]
  ui?: TableUiFilterCollection<TRow, TKey>
}
