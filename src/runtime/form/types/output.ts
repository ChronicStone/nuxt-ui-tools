import type {
  DeepPrettify,
  DeepTransformNestedPaths,
  PathToObject,
  UnionToIntersection,
} from '../../shared/types/utils'
import type { FormValue } from './'
import type {
  ArrayListFieldOutput,
  ArrayTableFieldOutput,
  ArrayTabsFieldOutput,
  ObjectFieldOutput,
  MatrixFieldOutput,
  ResolveFormFieldValue,
} from './field-output'
import type { FormStateMode, TransformOutputValue } from './field-output-utils'

export type {
  ExtractFormFieldInternalValue,
  NullableValue,
  ResolveFormFieldValue,
} from './field-output'
export type { FormStateMode } from './field-output-utils'

export type ExtractFormFieldOutputValue<TField> = TransformOutputValue<
  TField,
  ResolveFormFieldValue<TField>
>

type FieldKey<TField> = TField extends { key: infer TKey }
  ? TKey extends string
    ? TKey
    : never
  : never

type FieldValueObject<TField, TValue> =
  FieldKey<TField> extends infer TKey
    ? TKey extends string
      ? string extends TKey
        ? {}
        : PathToObject<TKey, TValue>
      : {}
    : {}

type OptionalPathToObject<Path extends string, Output> = Path extends `${infer First}.${infer Rest}`
  ? { [K in First]: OptionalPathToObject<Rest, Output> }
  : { [K in Path]?: Output }

type OptionalFieldValueObject<TField, TValue> =
  FieldKey<TField> extends infer TKey
    ? TKey extends string
      ? string extends TKey
        ? {}
        : OptionalPathToObject<TKey, TValue>
      : {}
    : {}

type ChildFields<TField> = TField extends { readonly fields: infer TFields }
  ? TFields extends readonly FormValue[]
    ? number extends TFields['length']
      ? readonly []
      : TFields
    : never
  : never

type FieldsValue<TFields, TMode extends FormStateMode> = TFields extends readonly FormValue[]
  ? DeepTransformNestedPaths<UnionToIntersection<FieldObject<TFields[number], TMode>>>
  : {}

type VariantValue<
  TVariant,
  TVariantKey extends string,
  TMode extends FormStateMode,
> = TVariant extends {
  readonly key: infer TKey
  readonly fields: infer TFields
}
  ? FieldsValue<TFields, TMode> & Record<TVariantKey, TKey> & VirtualFieldsValue<TVariant>
  : never

type VirtualFieldsValue<TField> = TField extends { readonly virtualFields: infer TVirtualFields }
  ? {
      [TKey in keyof TVirtualFields]: TVirtualFields[TKey] extends (
        ...args: never[]
      ) => infer TValue
        ? TValue
        : never
    }
  : {}

type ArrayVariantValue<TField, TMode extends FormStateMode> = TField extends {
  readonly variantKey: infer TVariantKey extends string
  readonly variants: readonly (infer TVariant)[]
}
  ? readonly VariantValue<TVariant, TVariantKey, TMode>[]
  : readonly FormValue[]

type ArrayFieldValue<TField, TMode extends FormStateMode> = TField extends { type: 'array-list' }
  ? ArrayListFieldOutput<FieldsValue<ChildFields<TField>, TMode> & VirtualFieldsValue<TField>>
  : TField extends { type: 'array-table' }
    ? ArrayTableFieldOutput<FieldsValue<ChildFields<TField>, TMode> & VirtualFieldsValue<TField>>
    : TField extends { type: 'array-tabs' }
      ? ArrayTabsFieldOutput<FieldsValue<ChildFields<TField>, TMode> & VirtualFieldsValue<TField>>
      : TField extends { type: 'array-variant' }
        ? ArrayVariantValue<TField, TMode>
        : never

type ApplyOutputMode<TField, TMode extends FormStateMode, TValue> = TMode extends 'output'
  ? TransformOutputValue<TField, TValue>
  : TValue

type ObjectFieldValue<TField, TMode extends FormStateMode> = ApplyOutputMode<
  TField,
  TMode,
  ObjectFieldOutput<FieldsValue<ChildFields<TField>, TMode>>
>

type MatrixRows<TField> = TField extends { readonly rows: infer TRows }
  ? TRows extends readonly { key: string }[]
    ? TRows
    : readonly []
  : readonly []

type MatrixFieldValue<TField, TMode extends FormStateMode> = ApplyOutputMode<
  TField,
  TMode,
  MatrixFieldOutput<MatrixRows<TField>, FieldsValue<ChildFields<TField>, TMode>>
>

type StatefulFieldObject<TField, TMode extends FormStateMode> = TMode extends 'output'
  ? TField extends { submit: { omit: true } }
    ? {}
    : TField extends { condition: infer _TCondition }
      ? OptionalFieldValueObject<
          TField,
          ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>
        >
      : FieldValueObject<TField, ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>>
  : FieldValueObject<TField, ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>>

type FieldObject<TField, TMode extends FormStateMode> = TField extends {
  type: 'info' | 'divider' | 'button'
}
  ? {}
  : TField extends { type: 'input-group' | 'card' | 'column' }
    ? FieldsValue<ChildFields<TField>, TMode>
    : TField extends { type: 'object' | 'group' }
      ? FieldValueObject<TField, ObjectFieldValue<TField, TMode>>
      : TField extends { type: 'matrix' }
        ? FieldValueObject<TField, MatrixFieldValue<TField, TMode>>
        : TField extends { type: 'array-list' | 'array-table' | 'array-tabs' | 'array-variant' }
          ? FieldValueObject<TField, ArrayFieldValue<TField, TMode>>
          : StatefulFieldObject<TField, TMode>

type StepFields<TStep> = TStep extends { readonly fields: infer TFields } ? TFields : never

type StepObject<TStep, TMode extends FormStateMode> = TStep extends FormValue
  ? TStep extends { readonly root: infer TRoot }
    ? TRoot extends string
      ? string extends TRoot
        ? FieldsValue<StepFields<TStep>, TMode>
        : PathToObject<TRoot, FieldsValue<StepFields<TStep>, TMode>>
      : FieldsValue<StepFields<TStep>, TMode>
    : FieldsValue<StepFields<TStep>, TMode>
  : never

type StepsValue<TSteps, TMode extends FormStateMode> = TSteps extends readonly FormValue[]
  ? DeepTransformNestedPaths<UnionToIntersection<StepObject<TSteps[number], TMode>>>
  : {}

/**
 * Extracts the complete internal form value from a raw authored schema.
 */
export type ExtractFormInternalValue<TSchema> = TSchema extends { readonly fields: infer TFields }
  ? DeepPrettify<FieldsValue<TFields, 'internal'>>
  : TSchema extends { readonly steps: infer TSteps }
    ? DeepPrettify<StepsValue<TSteps, 'internal'>>
    : {}

/**
 * Extracts the complete submitted output value from a raw authored schema.
 */
export type ExtractFormOutput<TSchema> = TSchema extends { readonly fields: infer TFields }
  ? DeepPrettify<FieldsValue<TFields, 'output'>>
  : TSchema extends { readonly steps: infer TSteps }
    ? DeepPrettify<StepsValue<TSteps, 'output'>>
    : {}
