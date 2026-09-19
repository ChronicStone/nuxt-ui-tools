import type { FormStatefulFieldBase } from '../../types/field-base'
import type {
  FieldOptionValue,
  FieldProps,
  FallbackNever,
  NullableValue,
} from '../../types/field-output-utils'
import type { FormAnyOptionConfig, FormOptionValue } from '../../types/options'
import type { FormText } from '../../types/utils'

export type FormHierarchyOption<TValue extends FormOptionValue = FormOptionValue> = {
  label: FormText
  description?: FormText
  disabled?: boolean
  children?: readonly FormHierarchyOption<TValue>[]
  /** `false` marks a remote node whose children load when it expands. */
  isLeaf?: boolean
} & ({ value: TValue; key?: TValue } | { key: TValue; value?: TValue })

export interface FormHierarchyProps {
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  childrenKey?: string
  valueKey?: string
  labelKey?: string
}

export interface FormTreeSelectionProps {
  /** Visual selection affordance. Defaults to checkbox for multiple trees and radio otherwise. */
  selectionControl?: 'none' | 'radio' | 'checkbox'
  /** Replaces the current selection or toggles individual nodes. */
  selectionBehavior?: 'toggle' | 'replace'
  /** Selects and clears every descendant when a parent is selected. */
  propagateSelect?: boolean
  /** Checks parents when all children are selected and exposes partial selection as indeterminate. */
  bubbleSelect?: boolean
  /** Enables both descendant propagation and parent bubbling. */
  cascade?: boolean
}

export interface FormTreeSelectProps extends FormHierarchyProps, FormTreeSelectionProps {
  showPath?: boolean
  showChildrenCount?: boolean
}

export interface FormCascaderProps extends FormHierarchyProps {
  separator?: string
  leafOnly?: boolean
}

export interface FormTreeProps extends FormHierarchyProps, FormTreeSelectionProps {
  virtualize?: boolean
}

interface FormHierarchyFieldOptions<
  TContext,
  TDeps,
  TValue extends FormOptionValue,
  TOption extends FormHierarchyOption<TValue>,
> {
  options: FormAnyOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
}

export interface FormTreeSelectField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormHierarchyOption<TValue> = FormHierarchyOption<TValue>,
>
  extends
    FormStatefulFieldBase<
      'tree-select',
      TValue | readonly TValue[] | null,
      TContext,
      TDeps,
      FormTreeSelectProps
    >,
    FormHierarchyFieldOptions<TContext, TDeps, TValue, TOption> {}

export interface FormCascaderField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormHierarchyOption<TValue> = FormHierarchyOption<TValue>,
>
  extends
    FormStatefulFieldBase<
      'cascader',
      TValue | readonly TValue[] | null,
      TContext,
      TDeps,
      FormCascaderProps
    >,
    FormHierarchyFieldOptions<TContext, TDeps, TValue, TOption> {}

export interface FormTreeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormHierarchyOption<TValue> = FormHierarchyOption<TValue>,
>
  extends
    FormStatefulFieldBase<
      'tree',
      TValue | readonly TValue[] | null,
      TContext,
      TDeps,
      FormTreeProps
    >,
    FormHierarchyFieldOptions<TContext, TDeps, TValue, TOption> {}

type HierarchyFieldValue<TField> =
  FieldProps<TField> extends { multiple: true }
    ? readonly FieldOptionValue<TField>[] | NullableValue
    : FieldOptionValue<TField> | NullableValue

export type HierarchyFieldOutput<TField> = FallbackNever<
  HierarchyFieldValue<TField>,
  FieldProps<TField> extends { multiple: true }
    ? readonly FormOptionValue[] | NullableValue
    : FormOptionValue | NullableValue
>

export type FormHierarchyField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> =
  | FormTreeSelectField<TContext, TDeps>
  | FormCascaderField<TContext, TDeps>
  | FormTreeField<TContext, TDeps>
