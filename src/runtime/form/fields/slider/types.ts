import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormObject } from '../../types/utils'

export interface FormSliderField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'slider',
  number | readonly number[],
  TContext,
  TDeps
> {
  min?: number
  max?: number
  step?: number
  multiple?: boolean
  tooltip?: boolean | FormObject
}

export type SliderFieldOutput<TField> = TField extends { multiple: true }
  ? readonly number[]
  : number | readonly number[]
