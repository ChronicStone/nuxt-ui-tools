import type { FormValue } from './'
import type { FormFieldCallback } from './callbacks'
import type { FormField } from './field'
import type { FormContainerLayout, FormItemLayout } from './layout'
import type { FormTransformConfig } from './transform'
import type { FormDynamic, FormMaybePromise, FormObject, FormRenderable, FormText } from './utils'
import type { FormValidationConfig } from './validation'

/**
 * Field kinds targeted by the current form runtime plan.
 */
export type FormFieldType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'number'
  | 'auto-complete'
  | 'checkbox'
  | 'switch'
  | 'switch-group'
  | 'radio'
  | 'radio-card'
  | 'checkbox-group'
  | 'checkbox-card'
  | 'select'
  | 'date'
  | 'datetime'
  | 'daterange'
  | 'monthrange'
  | 'datetimerange'
  | 'month'
  | 'year'
  | 'time'
  | 'phone-number'
  | 'hidden'
  | 'info'
  | 'divider'
  | 'input-group'
  | 'object'
  | 'custom-component'
  | 'file'
  | 'upload'
  | 'array-list'
  | 'array-table'
  | 'array-tabs'
  | 'array-variant'
  | 'tree-select'
  | 'cascader'
  | 'tree'
  | 'group'
  | 'matrix'
  | 'slider'
  | 'color-picker'
  | 'one-time-code'
  | 'tag'
  | 'rating'
  | 'button'
  | 'card'
  | 'column'

/**
 * Common stateful field properties.
 */
export interface FormStatefulFieldBase<
  TType extends FormFieldType,
  TValue,
  TContext = {},
  TDeps = {},
> {
  /** Raw path used to read/write the field value in form state. */
  key: string
  /** Discriminant used by the field registry. */
  type: TType
  /** Initial field value. */
  default?: FormDynamic<TValue, { ctx: TContext }>
  /** Label rendered by the field wrapper. */
  label?: FormText
  /** Optional supporting copy rendered near the control. */
  description?: FormText
  /** Optional right-side hint rendered by the field wrapper. */
  hint?: FormText
  /** Optional rich content rendered beside the label. Takes precedence over `hint`. */
  labelExtra?: FormRenderable
  /** Placeholder forwarded to controls that support placeholders. */
  placeholder?: FormText
  /** Raw dependency paths read before evaluating callbacks. */
  dependencies?: readonly (string | readonly [string, string])[]
  /** Item layout options for this field. */
  layout?: FormItemLayout
  /** UI-library-specific props. This intentionally stays open because Nuxt UI props can evolve. */
  props?: FormDynamic<FormObject, { ctx: TContext; deps: TDeps }>
  /** Disables the field without removing it from form state. */
  disabled?: FormFieldCallback<boolean, TContext, TDeps, TValue>
  /** Controls whether the field is rendered. Hidden fields can still be part of form state. */
  condition?: FormFieldCallback<boolean, TContext, TDeps, TValue>
  /** Validation behavior for this field. */
  validation?: FormValidationConfig<TValue, TContext, TDeps>
  /** Input/output transforms for this field. */
  transform?: FormTransformConfig<TValue, FormValue, TContext, TDeps>
  /** Submit/output behavior for this field. */
  submit?: {
    /** Excludes the field from submitted output while keeping it in internal form state. */
    omit?: boolean
  }
  /** Runs after this field value changes. */
  watch?: (params: { value: TValue; api: import('./api').FormFieldApi<TValue> }) => void
  /** Vue watch options used by the field value effect. */
  watchOptions?: { deep?: boolean; immediate?: boolean }
  /** Runs when the resolved dependency object changes. */
  onDependencyChange?: FormFieldCallback<FormMaybePromise<void>, TContext, TDeps, TValue>
  /** Runs after the field renderer is mounted. */
  onRendered?: FormFieldCallback<FormMaybePromise<void>, TContext, TDeps, TValue>
  /** Keeps the field in internal state while excluding it from rendering and submitted output. */
  ignore?: boolean
  /** Enables a field-level dirty reset affordance. */
  dirtyCheck?: boolean
  /** Wraps the field body in an expandable section. */
  collapsible?: boolean
  /** Initial collapsed state when `collapsible` is enabled. */
  collapsed?: boolean
  /** Debounces or throttles value/dependency effects. */
  stateEffect?: { type: 'debounce' | 'throttle'; duration: number }
}

/**
 * Base properties for stateless visual fields.
 */
export interface FormStatelessFieldBase<TType extends FormFieldType, TContext = {}, TDeps = {}> {
  /** Stable key for renderer identity. Stateless fields do not write form state. */
  key: string
  /** Discriminant used by the field registry. */
  type: TType
  /** Item layout options for this field. */
  layout?: FormItemLayout
  /** UI-library-specific props. */
  props?: FormDynamic<FormObject, { ctx: TContext; deps: TDeps }>
  /** Controls whether the field is rendered. */
  condition?: FormFieldCallback<boolean, TContext, TDeps>
  /** Excludes this renderer from the runtime. */
  ignore?: boolean
}

/**
 * Base properties for structural fields that render children.
 */
export interface FormContainerFieldBase<TType extends FormFieldType, TContext = {}, TDeps = {}> {
  /** Stable renderer key. */
  key: string
  /** Discriminant used by the field registry. */
  type: TType
  /** Optional title/label for structural renderers that expose one. */
  label?: FormText
  /** Optional supporting copy for structural renderers. */
  description?: FormText
  /** Child fields rendered inside this field. */
  fields: readonly FormField<TContext, TDeps>[]
  /** Container layout options. */
  layout?: FormContainerLayout
  /** UI-library-specific props. */
  props?: FormDynamic<FormObject, { ctx: TContext; deps: TDeps }>
  /** Controls whether the field is rendered. */
  condition?: FormFieldCallback<boolean, TContext, TDeps>
  /** Excludes this container and its children from the runtime. */
  ignore?: boolean
}
