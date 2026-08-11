import type { Component } from 'vue'

import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldDefaultValue, FallbackNever } from '../../types/field-output-utils'
import type { FormRenderable } from '../../types/utils'

export interface FormCustomComponentField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'custom-component',
  unknown,
  TContext,
  TDeps
> {
  component?: Component
  render?: FormFieldCallback<FormRenderable, TContext, TDeps>
}

export type CustomComponentFieldOutput<TField> = FallbackNever<FieldDefaultValue<TField>, unknown>
