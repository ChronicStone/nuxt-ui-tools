import type { QueryParameterOptions, ReactiveQueryState } from 'vue-qs'

import type {
  TableBooleanFilterDefinition,
  TableDateFilterDefinition,
  TableNumberFilterDefinition,
  TableOptionFilterDefinition,
  TableTextFilterDefinition,
  TableUiFilterDefinition,
} from './filters'
import type { TableLayout, TableSortingDirection } from './utils'
import type { TableResolvedSchema } from './utils'

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

export type TableQueryStateFilterKind = 'text' | 'option' | 'boolean' | 'number' | 'date'

export interface TableQueryStateSort<TKey extends string = string> {
  key: TKey
  dir: TableSortingDirection
}

export interface TableQueryStateFilterRange<TValue = string | number> {
  from?: TValue
  to?: TValue
}

export type TableQueryStateFilterValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | Date
  | TableQueryStateFilterRange<string | number | Date>

export interface TableQueryStateFilterDefinition<TKey extends string = string> {
  key: TKey
  kind: TableQueryStateFilterKind
  defaultValue?: TableQueryStateFilterValue
  defaultOperator?: TableFilterOperator
  operators?: TableFilterOperator[]
}

export interface TableQueryStateFilterRule<
  TKey extends string = string,
  TOperator extends string = TableFilterOperator,
  TValue = TableQueryStateFilterValue,
> {
  key: TKey
  operator?: TOperator
  value: TValue
}

export interface TableFilterState<TFilterKey extends string = string> {
  search: string
  ui: TableQueryStateFilterRule<TFilterKey>[]
}

export interface TableQueryState<
  TFilterKey extends string = string,
  TSortKey extends string = string,
> {
  layout?: TableLayout
  page: number
  pageSize: number
  sort?: TableQueryStateSort<TSortKey> | null
  search: string
  filters: TableQueryStateFilterRule<TFilterKey>[]
}

export interface TableQueryStateDefaults<
  TFilterKey extends string = string,
  TSortKey extends string = string,
> {
  layout?: TableLayout
  page: number
  pageSize: number
  sort?: TableQueryStateSort<TSortKey> | null
  search: string
  filters?: TableQueryStateFilterDefinition<TFilterKey>[]
}

export type TableQueryStateFilterParameterKey<
  TKey extends string = string,
  TOperator extends string = TableFilterOperator,
> = `f.ui.${TKey}` | `f.ui.${TKey}~${TOperator}`

export interface TableQueryStateSchemaOptions<
  TFilterKey extends string = string,
  TSortKey extends string = string,
> {
  sortKeys?: TSortKey[]
  defaults: TableQueryStateDefaults<TFilterKey, TSortKey>
}

export type TableQueryStateParameterSchema<
  _TFilterKey extends string = string,
  TSortKey extends string = string,
> = Record<string, QueryParameterOptions<any>> & {
  l: QueryParameterOptions<TableLayout | undefined>
  'p.page': QueryParameterOptions<number>
  'p.size': QueryParameterOptions<number>
  'f.search': QueryParameterOptions<string>
  's.key': QueryParameterOptions<TSortKey | undefined>
  's.dir': QueryParameterOptions<TableSortingDirection | undefined>
}

export type TableQueryStateParameterState<
  TFilterKey extends string = string,
  TSortKey extends string = string,
> = ReactiveQueryState<TableQueryStateParameterSchema<TFilterKey, TSortKey>>

export type TableQueryStateFilterParameterState<
  TFilterKey extends string = string,
> = Record<string, any> & Partial<
  Record<TableQueryStateFilterParameterKey<TFilterKey>, TableQueryStateFilterValue | undefined>
>

export type ExtractTableUiFilterDefinition<TSchema> =
  TableResolvedSchema<TSchema> extends { filters?: { ui?: infer TFilters extends TableUiFilterDefinition[] } }
    ? TFilters[number]
    : never

export type ExtractTableFilterKey<TSchema> = ExtractTableUiFilterDefinition<TSchema> extends {
  key: infer TKey extends string
}
  ? TKey
  : never

type DefaultFilterOperatorByKind<TKind> = TKind extends 'text'
  ? 'contains'
  : TKind extends 'option'
    ? 'isAnyOf'
    : TKind extends 'boolean'
      ? 'is'
      : TKind extends 'number'
        ? 'is'
        : TKind extends 'date'
          ? 'is'
          : TableFilterOperator

export type ExtractTableFilterOperator<TSchema, TKey extends ExtractTableFilterKey<TSchema>> =
  Extract<ExtractTableUiFilterDefinition<TSchema>, { key: TKey }> extends infer TDefinition
    ? TDefinition extends { kind: infer TKind; defaultOperator?: infer TDefault; operators?: infer TOperators }
      ? | Extract<TDefault, TableFilterOperator>
        | Extract<TOperators, TableFilterOperator[]>[number]
        | DefaultFilterOperatorByKind<TKind>
      : TableFilterOperator
    : TableFilterOperator

type ExtractFilterValueFromDefinition<TDefinition> =
  TDefinition extends TableTextFilterDefinition<any, any, any>
    ? string
    : TDefinition extends TableOptionFilterDefinition<any, any, any, infer TValue>
      ? TValue[]
      : TDefinition extends TableBooleanFilterDefinition<any, any, any>
        ? boolean
        : TDefinition extends TableNumberFilterDefinition<any, any, any>
          ? number | TableQueryStateFilterRange<number>
          : TDefinition extends TableDateFilterDefinition<any, any, any>
            ? Date | TableQueryStateFilterRange<Date>
            : TableQueryStateFilterValue

export type ExtractTableFilterValue<TSchema, TKey extends ExtractTableFilterKey<TSchema>> =
  ExtractFilterValueFromDefinition<Extract<ExtractTableUiFilterDefinition<TSchema>, { key: TKey }>>

export type ExtractTableFilterRule<TSchema, TKey extends ExtractTableFilterKey<TSchema>> = {
  key: TKey
  operator?: ExtractTableFilterOperator<TSchema, TKey>
  value: ExtractTableFilterValue<TSchema, TKey>
}
