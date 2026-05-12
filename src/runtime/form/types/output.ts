import type { DeepPrettify, DeepTransformNestedPaths, PathToObject, UnionToIntersection } from '../../shared/types/utils'
import type {
  ArrayListFieldOutput,
  ArrayTabsFieldOutput,
  ArrayVariantFieldOutput,
  ExtractFormFieldInternalValue,
  ObjectFieldOutput,
  ResolveFormFieldValue,
} from './field-output'
import type { FormStateMode, TransformOutputValue } from './field-output-utils'

export type {
  ExtractFormFieldInternalValue,
  NullableValue,
  ResolveFormFieldValue,
} from './field-output'
export type { FormStateMode } from './field-output-utils'

export type ExtractFormFieldOutputValue<TField> =
  TransformOutputValue<TField, ResolveFormFieldValue<TField>>

type FieldKey<TField> = TField extends { key: infer TKey }
  ? TKey extends string ? TKey : never
  : never

type FieldValueObject<TField, TValue> = FieldKey<TField> extends infer TKey
  ? TKey extends string
    ? string extends TKey ? {} : PathToObject<TKey, TValue>
    : {}
  : {}

type OptionalPathToObject<Path extends string, Output> = Path extends `${infer First}.${infer Rest}`
  ? { [K in First]: OptionalPathToObject<Rest, Output> }
  : { [K in Path]?: Output }

type OptionalFieldValueObject<TField, TValue> = FieldKey<TField> extends infer TKey
  ? TKey extends string
    ? string extends TKey ? {} : OptionalPathToObject<TKey, TValue>
    : {}
  : {}

type ChildFields<TField> = TField extends { readonly fields: infer TFields }
  ? TFields extends readonly unknown[]
    ? number extends TFields['length'] ? readonly [] : TFields
    : never
  : never

type FieldsValue<TFields, TMode extends FormStateMode> = TFields extends readonly unknown[]
  ? DeepTransformNestedPaths<UnionToIntersection<FieldObject<TFields[number], TMode>>>
  : {}

type ArrayFieldValue<TField, TMode extends FormStateMode> = TField extends { type: 'array-list' }
  ? ArrayListFieldOutput<FieldsValue<ChildFields<TField>, TMode>>
  : TField extends { type: 'array-tabs' }
    ? ArrayTabsFieldOutput<FieldsValue<ChildFields<TField>, TMode>>
    : TField extends { type: 'array-variant' }
      ? ArrayVariantFieldOutput<FieldsValue<ChildFields<TField>, TMode>>
      : never

type ApplyOutputMode<TField, TMode extends FormStateMode, TValue> = TMode extends 'output'
  ? TransformOutputValue<TField, TValue>
  : TValue

type ObjectFieldValue<TField, TMode extends FormStateMode> =
  ApplyOutputMode<TField, TMode, ObjectFieldOutput<FieldsValue<ChildFields<TField>, TMode>>>

type StatefulFieldObject<TField, TMode extends FormStateMode> =
  TMode extends 'output'
    ? TField extends { submit: { omit: true } }
      ? {}
      : TField extends { condition: infer _TCondition }
        ? OptionalFieldValueObject<TField, ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>>
        : FieldValueObject<TField, ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>>
    : FieldValueObject<TField, ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>>

type FieldObject<TField, TMode extends FormStateMode> =
  TField extends { type: 'info' | 'divider' | 'button' }
    ? {}
    : TField extends { type: 'input-group' }
      ? FieldsValue<ChildFields<TField>, TMode>
      : TField extends { type: 'object' }
        ? FieldValueObject<TField, ObjectFieldValue<TField, TMode>>
        : TField extends { type: 'array-list' | 'array-tabs' | 'array-variant' }
          ? FieldValueObject<TField, ArrayFieldValue<TField, TMode>>
          : StatefulFieldObject<TField, TMode>

type StepFields<TStep> = TStep extends { readonly fields: infer TFields }
  ? TFields
  : never

type StepObject<TStep, TMode extends FormStateMode> = TStep extends unknown
  ? TStep extends { readonly root: infer TRoot }
    ? TRoot extends string
      ? string extends TRoot
        ? FieldsValue<StepFields<TStep>, TMode>
        : PathToObject<TRoot, FieldsValue<StepFields<TStep>, TMode>>
      : FieldsValue<StepFields<TStep>, TMode>
    : FieldsValue<StepFields<TStep>, TMode>
  : never

type StepsValue<TSteps, TMode extends FormStateMode> = TSteps extends readonly unknown[]
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
