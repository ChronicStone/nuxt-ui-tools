import type {
  DeepPrettify,
  DeepTransformNestedPaths,
  PathToObject,
  UnionToIntersection,
} from '../../shared/types/utils'
import type { FormObject, FormValue } from './'
import type {
  ArrayCollapseFieldOutput,
  ArrayListFieldOutput,
  ArrayPrimitiveFieldOutput,
  ArrayTableFieldOutput,
  ArrayTabsFieldOutput,
  ObjectFieldOutput,
  MatrixFieldOutput,
  ResolveFormFieldValue,
} from './field-output'
import type {
  FormStateMode,
  NullableValue,
  TransformInputValue,
  TransformOutputValue,
} from './field-output-utils'

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
        ? NonNullable<unknown>
        : PathToObject<TKey, TValue>
      : NonNullable<unknown>
    : NonNullable<unknown>

type OptionalPathToObject<Path extends string, Output> = Path extends `${infer First}.${infer Rest}`
  ? { [K in First]: OptionalPathToObject<Rest, Output> }
  : { [K in Path]?: Output }

type OptionalFieldValueObject<TField, TValue> =
  FieldKey<TField> extends infer TKey
    ? TKey extends string
      ? string extends TKey
        ? NonNullable<unknown>
        : OptionalPathToObject<TKey, TValue>
      : NonNullable<unknown>
    : NonNullable<unknown>

type ChildFields<TField> = TField extends { readonly fields: infer TFields }
  ? TFields extends readonly FormValue[]
    ? number extends TFields['length']
      ? readonly []
      : TFields
    : never
  : never

type TabObject<TTab, TMode extends FormStateMode> = TTab extends { readonly fields: infer TFields }
  ? FieldsValue<TFields, TMode>
  : never

type TabsFieldsValue<TField, TMode extends FormStateMode> = TField extends {
  readonly tabs: readonly (infer TTab)[]
}
  ? DeepTransformNestedPaths<UnionToIntersection<TabObject<TTab, TMode>>>
  : NonNullable<unknown>

type FieldsValue<TFields, TMode extends FormStateMode> = TFields extends readonly FormValue[]
  ? number extends TFields['length']
    ? FormObject
    : DeepTransformNestedPaths<UnionToIntersection<FieldObject<TFields[number], TMode>>>
  : NonNullable<unknown>

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
  : NonNullable<unknown>

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
        : TField extends { type: 'array-collapse' }
          ? ArrayCollapseFieldOutput<
              FieldsValue<ChildFields<TField>, TMode> & VirtualFieldsValue<TField>
            >
          : never

type ApplyOutputMode<TField, TMode extends FormStateMode, TValue> = TMode extends 'output'
  ? TransformOutputValue<TField, TValue>
  : TMode extends 'input'
    ? TransformInputValue<TField, TValue | NullableValue>
    : TValue

/** Input leaves every key out and accepts `null`, since a form fills in defaults for what is missing. */
type ModeFieldValueObject<TField, TMode extends FormStateMode, TValue> = TMode extends 'input'
  ? OptionalFieldValueObject<TField, TValue>
  : FieldValueObject<TField, TValue>

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

type StatefulFieldObject<TField, TMode extends FormStateMode> = TMode extends 'input'
  ? OptionalFieldValueObject<TField, ApplyOutputMode<TField, TMode, ResolveFormFieldValue<TField>>>
  : TMode extends 'output'
    ? TField extends { submit: { omit: true } }
      ? NonNullable<unknown>
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
  ? NonNullable<unknown>
  : TField extends { type: 'tabs' }
    ? TabsFieldsValue<TField, TMode>
    : TField extends { type: 'input-group' | 'card' | 'column' }
      ? FieldsValue<ChildFields<TField>, TMode>
      : TField extends { type: 'object' | 'group' }
        ? ModeFieldValueObject<TField, TMode, ObjectFieldValue<TField, TMode>>
        : TField extends { type: 'matrix' }
          ? ModeFieldValueObject<TField, TMode, MatrixFieldValue<TField, TMode>>
          : TField extends {
                type:
                  | 'array-list'
                  | 'array-table'
                  | 'array-tabs'
                  | 'array-variant'
                  | 'array-collapse'
              }
            ? ModeFieldValueObject<TField, TMode, ArrayFieldValue<TField, TMode>>
            : TField extends { type: 'array-primitive' }
              ? ModeFieldValueObject<
                  TField,
                  TMode,
                  ApplyOutputMode<TField, TMode, ArrayPrimitiveFieldOutput<TField>>
                >
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
  : NonNullable<unknown>

/**
 * Extracts the complete internal form value from a raw authored schema.
 */
export type ExtractFormInternalValue<TSchema> = TSchema extends { readonly fields: infer TFields }
  ? DeepPrettify<FieldsValue<TFields, 'internal'>>
  : TSchema extends { readonly steps: infer TSteps }
    ? DeepPrettify<StepsValue<TSteps, 'internal'>>
    : NonNullable<unknown>

/**
 * Extracts the value a form accepts as `input` from a raw authored schema: every key optional,
 * `null` accepted, and a field with `transform.input` typed by the value that hook takes.
 */
export type ExtractFormInput<TSchema> = TSchema extends { readonly fields: infer TFields }
  ? FormInputValue<DeepPrettify<FieldsValue<TFields, 'input'>>>
  : TSchema extends { readonly steps: infer TSteps }
    ? FormInputValue<DeepPrettify<StepsValue<TSteps, 'input'>>>
    : FormObject

/** Makes every key of plain records optional, through arrays, leaving files and dates whole. */
type FormInputValue<TValue> = TValue extends Date | Blob
  ? TValue
  : TValue extends readonly (infer TItem)[]
    ? readonly FormInputValue<TItem>[]
    : TValue extends FormObject
      ? { [TKey in keyof TValue]?: FormInputValue<TValue[TKey]> }
      : TValue

/**
 * Extracts the complete submitted output value from a raw authored schema. Its arrays are mutable:
 * the submitted value is a fresh object, and request bodies inferred from validators take mutable
 * arrays, so `formData` passes to them as it is.
 */
export type ExtractFormOutput<TSchema> = TSchema extends { readonly fields: infer TFields }
  ? FormOutputValue<DeepPrettify<FieldsValue<TFields, 'output'>>>
  : TSchema extends { readonly steps: infer TSteps }
    ? FormOutputValue<DeepPrettify<StepsValue<TSteps, 'output'>>>
    : NonNullable<unknown>

/** Drops `readonly` from arrays and tuples through plain records, leaving files and dates whole. */
type FormOutputValue<TValue> = TValue extends Date | Blob
  ? TValue
  : TValue extends readonly unknown[]
    ? { -readonly [TIndex in keyof TValue]: FormOutputValue<TValue[TIndex]> }
    : TValue extends FormObject
      ? { [TKey in keyof TValue]: FormOutputValue<TValue[TKey]> }
      : TValue
