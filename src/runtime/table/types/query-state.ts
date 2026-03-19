import type {
  TableBooleanFilterOperator,
  TableDateFilterOperator,
  TableFilterPrimitiveValue,
  TableBooleanFilterDefinition,
  TableDateFilterDefinition,
  TableNumberFilterOperator,
  TableNumberFilterDefinition,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableTextFilterOperator,
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
  | Array<TableFilterPrimitiveValue>
  | Date
  | TableQueryStateFilterRange<number>
  | TableQueryStateFilterRange<Date>

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

export type ExtractTableUiFilterDefinition<TSchema> =
  TableResolvedSchema<TSchema> extends {
    filters?: { ui?: infer TFilters extends TableUiFilterDefinition[] }
  }
    ? TFilters[number]
    : never

export type ExtractTableFilterKey<TSchema> =
  ExtractTableUiFilterDefinition<TSchema> extends {
    key: infer TKey extends string
  }
    ? TKey
    : never

type ExtractDefinitionForKey<TSchema, TKey extends ExtractTableFilterKey<TSchema>> = Extract<
  ExtractTableUiFilterDefinition<TSchema>,
  { key: TKey }
>

type DefinitionForKeyOrFallback<TSchema, TKey extends ExtractTableFilterKey<TSchema>> = [
  ExtractDefinitionForKey<TSchema, TKey>,
] extends [never]
  ? ExtractTableUiFilterDefinition<TSchema>
  : ExtractDefinitionForKey<TSchema, TKey>

type FilterOperatorsByKind<TKind> = TKind extends 'text'
  ? TableTextFilterOperator
  : TKind extends 'option'
    ? TableOptionFilterOperator
    : TKind extends 'boolean'
      ? TableBooleanFilterOperator
      : TKind extends 'number'
        ? TableNumberFilterOperator
        : TKind extends 'date'
          ? TableDateFilterOperator
          : TableFilterOperator

export type ExtractTableFilterOperator<TSchema, TKey extends ExtractTableFilterKey<TSchema>> =
  DefinitionForKeyOrFallback<TSchema, TKey> extends infer TDefinition
    ? TDefinition extends {
        kind: infer TKind
      }
      ? FilterOperatorsByKind<TKind>
      : TableFilterOperator
    : TableFilterOperator

type ExtractFilterValueFromDefinition<TDefinition> =
  TDefinition extends TableTextFilterDefinition<object, object, string>
    ? string
    : TDefinition extends TableOptionFilterDefinition<object, object, string, infer TValue>
      ? TValue[]
      : TDefinition extends TableBooleanFilterDefinition<object, object, string>
        ? boolean
        : TDefinition extends TableNumberFilterDefinition<object, object, string>
          ? number | TableQueryStateFilterRange<number>
          : TDefinition extends TableDateFilterDefinition<object, object, string>
            ? Date | TableQueryStateFilterRange<Date>
            : TableQueryStateFilterValue

export type ExtractTableFilterValue<
  TSchema,
  TKey extends ExtractTableFilterKey<TSchema>,
> = ExtractFilterValueFromDefinition<
  DefinitionForKeyOrFallback<TSchema, TKey>
>

export type ExtractTableFilterRule<TSchema, TKey extends ExtractTableFilterKey<TSchema>> = {
  key: TKey
  operator?: ExtractTableFilterOperator<TSchema, TKey>
  value: ExtractTableFilterValue<TSchema, TKey>
}
