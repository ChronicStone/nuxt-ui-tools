import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, FallbackNever, NullableValue } from '../../types/field-output-utils'
import type { FormOptionConfig, FormOptionValue, FormOptionsSource } from '../../types/options'
import type { FormText } from '../../types/utils'

export type FormHierarchyOption<TValue extends FormOptionValue = FormOptionValue> = {
  label: FormText
  description?: FormText
  disabled?: boolean
  children?: readonly FormHierarchyOption<TValue>[]
} & ({ value: TValue; key?: TValue } | { key: TValue; value?: TValue })

interface FormHierarchyFieldOptions<
  TContext,
  TDeps,
  TValue extends FormOptionValue,
  TOption extends FormHierarchyOption<TValue>,
> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  childrenKey?: string
  valueKey?: string
  labelKey?: string
}

interface FormTreeSelectionOptions {
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

export interface FormTreeSelectField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormHierarchyOption<TValue> = FormHierarchyOption<TValue>,
>
  extends
    FormStatefulFieldBase<'tree-select', TValue | readonly TValue[] | null, TContext, TDeps>,
    FormHierarchyFieldOptions<TContext, TDeps, TValue, TOption>,
    FormTreeSelectionOptions {
  showPath?: boolean
  showChildrenCount?: boolean
}

export interface FormCascaderField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormHierarchyOption<TValue> = FormHierarchyOption<TValue>,
>
  extends
    FormStatefulFieldBase<'cascader', TValue | readonly TValue[] | null, TContext, TDeps>,
    FormHierarchyFieldOptions<TContext, TDeps, TValue, TOption> {
  separator?: string
  leafOnly?: boolean
}

export interface FormTreeField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormHierarchyOption<TValue> = FormHierarchyOption<TValue>,
>
  extends
    FormStatefulFieldBase<'tree', TValue | readonly TValue[] | null, TContext, TDeps>,
    FormHierarchyFieldOptions<TContext, TDeps, TValue, TOption>,
    FormTreeSelectionOptions {
  virtualize?: boolean
}

type HierarchyFieldValue<TField> = TField extends { multiple: true }
  ? readonly FieldOptionValue<TField>[] | NullableValue
  : FieldOptionValue<TField> | NullableValue

export type HierarchyFieldOutput<TField> = FallbackNever<
  HierarchyFieldValue<TField>,
  TField extends { multiple: true }
    ? readonly FormOptionValue[] | NullableValue
    : FormOptionValue | NullableValue
>

export type FormHierarchyField<TContext = {}, TDeps = {}> =
  | FormTreeSelectField<TContext, TDeps>
  | FormCascaderField<TContext, TDeps>
  | FormTreeField<TContext, TDeps>
