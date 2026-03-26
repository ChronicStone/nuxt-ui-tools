import type {
  DeepPartial,
  DeepPrettify,
  DeepTransformNestedPaths,
  PathToObject,
  UnionToIntersection,
} from '../../shared/types/utils'
import type { SpreadsheetContextDataFromItems, SpreadsheetContextItem } from './context'
import type {
  SpreadsheetColumnDefinition,
  SpreadsheetColumnGroupDefinition,
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicCollectionItemDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetDynamicValueDefinition,
  SpreadsheetResolvedColumns,
} from './columns'
import type { InferSpreadsheetReferenceValue, SpreadsheetReferenceDefinition } from './references'

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

type ResolveDynamicValue<TValueDefinition extends SpreadsheetDynamicValueDefinition> =
  TValueDefinition extends { kind: 'text' } ? string
    : TValueDefinition extends { kind: 'number' } ? number
      : TValueDefinition extends { kind: 'date' } ? string
        : TValueDefinition extends { kind: 'boolean' } ? boolean
          : TValueDefinition extends { kind: 'options', mode: infer TMode, optionValue?: (option: any) => infer TValue }
            ? TMode extends 'multiple'
              ? TValue[]
              : TValue
            : TValueDefinition extends { kind: 'options', mode: infer TMode }
              ? TMode extends 'multiple'
                ? TValueDefinition extends { from: readonly (infer TOption)[] }
                  ? TOption extends { value: infer TValue }
                    ? TValue[]
                    : never
                  : never
                : TValueDefinition extends { from: readonly (infer TOption)[] }
                  ? TOption extends { value: infer TValue }
                    ? TValue
                    : never
                  : never
              : never

type ResolveDynamicItemValue<TItem> =
  TItem extends SpreadsheetDynamicCollectionItemDefinition<any, infer TValueInput, any, any>
    ? TValueInput extends (...args: infer _Args) => infer TValueDefinition
      ? TValueDefinition extends SpreadsheetDynamicValueDefinition
        ? ResolveDynamicValue<TValueDefinition>
        : never
      : TValueInput extends SpreadsheetDynamicValueDefinition
        ? ResolveDynamicValue<TValueInput>
        : never
    : never

type CollectionItemOutput<TItem> = TItem extends SpreadsheetDynamicCollectionItemDefinition<
  infer TId,
  infer _TValueInput,
  infer _TSource,
  infer TBuild
>
  ? [TBuild] extends [unknown]
    ? ResolveDynamicItemValue<TItem> extends infer TResult
      ? TResult extends readonly unknown[]
        ? { id: TId, values: TResult }
        : { id: TId, value: TResult }
      : never
    : TBuild
  : never

type CollectionRecordOutput<TItems> = TItems extends readonly (infer TItem)[]
    ? IntersectionOrEmpty<
      TItem extends SpreadsheetDynamicCollectionItemDefinition<
        infer TId,
        infer _TValueInput,
        infer _TSource,
        infer TBuild
      >
        ? [TBuild] extends [unknown]
          ? PathToObject<TId, ResolveDynamicItemValue<TItem>>
          : PathToObject<TId, TBuild>
        : never
    >
  : {}

type DynamicCollectionOutput<TColumn> = TColumn extends SpreadsheetDynamicCollectionDefinition<
  infer TRootKey,
  infer TAs,
  infer TItems,
  infer _TOutput
>
  ? TItems extends readonly unknown[]
    ? TAs extends 'array'
      ? Partial<PathToObject<TRootKey, readonly CollectionItemOutput<TItems[number]>[]>>
      : Partial<PathToObject<TRootKey, DeepTransformNestedPaths<CollectionRecordOutput<TItems>>>>
    : never
  : never

type DynamicOptionGroupsOutput<TDynamicColumn> =
  TDynamicColumn extends SpreadsheetDynamicOptionGroupsDefinition<any, infer TInto, infer TValue>
    ? Partial<PathToObject<TInto, Record<string, TValue[]>>>
    : never

type DynamicColumnOutput<TDynamicColumn> =
  | DynamicOptionGroupsOutput<TDynamicColumn>
  | DynamicCollectionOutput<TDynamicColumn>

type DynamicRowOutput<TColumns> = DeepPrettify<
  DeepTransformNestedPaths<
    DynamicEntriesFromColumns<TColumns> extends readonly (infer TEntry)[]
      ? IntersectionOrEmpty<DynamicColumnOutput<TEntry>>
      : {}
  >
>

type ResolveSchemaReferences<TSchema> = TSchema extends {
  references?: (...args: infer _Args) => infer TReferences
}
  ? Exclude<TReferences, undefined>
  : TSchema extends { references?: infer TReferences }
    ? Exclude<TReferences, undefined>
    : readonly []

type ReferenceField<TReference> = TReference extends SpreadsheetReferenceDefinition<infer TField, any, any>
  ? TField
  : never

type ReferenceOutput<TReference> = [ReferenceField<TReference>] extends [never]
  ? never
  : DeepPartial<PathToObject<ReferenceField<TReference>, InferSpreadsheetReferenceValue<TReference>>>

type ReferenceRowOutput<TReferences> = TReferences extends readonly unknown[]
  ? DeepPrettify<DeepTransformNestedPaths<IntersectionOrEmpty<ReferenceOutput<TReferences[number]>>>>
  : {}

export type SpreadsheetRowData<TColumns, TReferences = readonly []> = DeepPrettify<
  StaticRowOutput<TColumns> & DynamicRowOutput<TColumns> & ReferenceRowOutput<TReferences>
>

type SchemaColumns<TSchema> = TSchema extends {
  columns?: infer TColumns
}
  ? Exclude<TColumns, undefined>
  : never

export type SpreadsheetData<TSchema> = SpreadsheetRowData<
  SpreadsheetResolvedColumns<SchemaColumns<TSchema>>,
  ResolveSchemaReferences<TSchema>
>

export type ExtractSpreadsheetRow<TSchema> = SpreadsheetData<TSchema>

export type ExtractSpreadsheetContextData<TSchema> = TSchema extends {
  context?: infer TContextItems extends readonly SpreadsheetContextItem<string, unknown>[]
}
  ? SpreadsheetContextDataFromItems<TContextItems>
  : {}

export type ExtractSpreadsheetSubmitPayload<TSchema> = TSchema extends {
  buildRow?: (...args: infer _Args) => infer TResult
}
  ? [Awaited<TResult>] extends [never]
    ? SpreadsheetData<TSchema>
    : Awaited<TResult>
  : SpreadsheetData<TSchema>
