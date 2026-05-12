import type { FormStatefulFieldBase } from '../../types/field-base'

export interface FormSliderField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'slider', number | readonly number[], TContext, TDeps> {
  min?: number
  max?: number
  step?: number
}

export type SliderFieldOutput<TField> = TField extends { multiple: true }
  ? readonly number[]
  : number | readonly number[]
