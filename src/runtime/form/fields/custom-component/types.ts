import type { Component } from 'vue'

import type { FormValue } from '../../types'
import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldDefaultValue, FallbackNever } from '../../types/field-output-utils'
import type { FormRenderable } from '../../types/utils'

export interface FormCustomComponentField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'custom-component', FormValue, TContext, TDeps> {
  /**
   * Renders the field as a control: the component receives the field value as `modelValue`, its
   * resolved `props`, and `disabled`, and sets the value by emitting `update:modelValue`.
   */
  component?: Component
  /** Renders free content from the field callback params, `{ ctx, deps, api }`. */
  render?: FormFieldCallback<FormRenderable, TContext, TDeps>
}

export type CustomComponentFieldOutput<TField> = FallbackNever<FieldDefaultValue<TField>, FormValue>
