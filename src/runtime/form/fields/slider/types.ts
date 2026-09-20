import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldProps } from '../../types/field-output-utils'
import type { FormObject } from '../../types/utils'

export interface FormSliderProps {
  min?: number
  max?: number
  step?: number
  multiple?: boolean
  tooltip?: boolean | FormObject
}

export type FormSliderField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'slider', number | readonly number[], TContext, TDeps, FormSliderProps>

export type SliderFieldOutput<TField> =
  FieldProps<TField> extends { multiple: true } ? readonly number[] : number | readonly number[]
