import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormColorPickerField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'color-picker', string | null, TContext, TDeps> {
  format?: 'hex' | 'rgb' | 'hsl' | 'cmyk' | 'lab'
  throttle?: number
}

export type ColorPickerFieldOutput = string | NullableValue
