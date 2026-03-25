import type {
  DeepPartial,
  DeepPrettify,
  DeepTransformNestedPaths,
  PathToObject,
  UnionToIntersection,
} from '../../shared/types/utils'
import type { SpreadsheetContextItem, SpreadsheetContextDataFromItems } from './context'
import type {
  SpreadsheetColumnDefinition,
  SpreadsheetColumnGroupDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetResolvedColumns,
} from './columns'
import type { SpreadsheetReferenceDefinition } from './references'

type IntersectionOrEmpty<TValue> = [TValue] extends [never] ? {} : UnionToIntersection<TValue>

type StaticEntriesFromColumns<TColumns> = TColumns extends {
  static?: (...args: infer _Args) => infer TResult
}
  ? TResult
  : TColumns extends { static?: infer TResult }
    ? TResult
    : readonly []

type DynamicEntriesFromColumns<TColumns> = TColumns extends {
  dynamic?: (...args: infer _Args) => infer TResult
}
  ? TResult
  : readonly []

type FlattenStaticColumns<TEntries> = TEntries extends readonly (infer TEntry)[]
  ? TEntry extends SpreadsheetColumnGroupDefinition<any, infer TColumns>
    ? FlattenStaticColumns<TColumns>
    : TEntry
  : never

type StaticColumnOutput<TColumn> = TColumn extends SpreadsheetColumnDefinition<
  infer TKey,
  infer TValue,
  infer TRequired,
  infer _TContext
>
  ? TRequired extends true
    ? PathToObject<TKey, TValue>
    : DeepPartial<PathToObject<TKey, TValue>>
  : never

type StaticRowOutput<TColumns> = DeepPrettify<
  DeepTransformNestedPaths<
    IntersectionOrEmpty<StaticColumnOutput<FlattenStaticColumns<StaticEntriesFromColumns<TColumns>>>>
  >
>

type DynamicColumnOutput<TDynamicColumn> = TDynamicColumn extends SpreadsheetDynamicOptionGroupsDefinition<
  any,
  infer TInto,
  infer TValue
>
  ? Partial<PathToObject<TInto, Record<string, TValue[]>>>
  : never

type DynamicRowOutput<TColumns> = DeepPrettify<
  DeepTransformNestedPaths<
    DynamicEntriesFromColumns<TColumns> extends readonly (infer TEntry)[]
      ? IntersectionOrEmpty<DynamicColumnOutput<TEntry>>
      : {}
  >
>

type ReferenceOutput<TReference> = TReference extends SpreadsheetReferenceDefinition<
  any,
  any,
  infer TField extends string,
  infer TValue,
  any
>
  ? DeepPartial<PathToObject<TField, TValue>>
  : never

type ReferenceRowOutput<TReferences> = TReferences extends readonly unknown[]
  ? DeepPrettify<DeepTransformNestedPaths<IntersectionOrEmpty<ReferenceOutput<TReferences[number]>>>>
  : {}

export type SpreadsheetRowData<TColumns, TReferences = readonly []> = DeepPrettify<
  StaticRowOutput<TColumns> & DynamicRowOutput<TColumns> & ReferenceRowOutput<TReferences>
>

type SchemaColumns<TSchema> = TSchema extends {
  columns?: infer TColumns
}
  ? TColumns
  : never

type SchemaReferences<TSchema> = TSchema extends {
  references?: infer TReferences
}
  ? TReferences
  : readonly []

export type SpreadsheetData<TSchema> = SpreadsheetRowData<
  SpreadsheetResolvedColumns<SchemaColumns<TSchema>>,
  SchemaReferences<TSchema>
>

export type ExtractSpreadsheetRow<TSchema> = SpreadsheetData<TSchema>

export type ExtractSpreadsheetContextData<TSchema> = TSchema extends {
  context?: infer TContextItems extends readonly SpreadsheetContextItem<string, unknown>[]
}
  ? SpreadsheetContextDataFromItems<TContextItems>
  : {}

export type ExtractSpreadsheetSubmitPayload<TSchema> = TSchema extends {
  pipeline?: {
    submit?: (...args: infer _Args) => infer TResult
  }
}
  ? [Awaited<TResult>] extends [never]
    ? SpreadsheetData<TSchema>
    : Awaited<TResult>
  : SpreadsheetData<TSchema>
