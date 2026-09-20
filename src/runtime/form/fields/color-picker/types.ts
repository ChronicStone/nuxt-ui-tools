import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormColorPickerProps {
  display?: 'popover' | 'inline' | 'swatch'
  format?: 'hex' | 'rgb' | 'hsl' | 'cmyk' | 'lab'
  throttle?: number
  clearable?: boolean
}

export type FormColorPickerField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'color-picker', string | null, TContext, TDeps, FormColorPickerProps>

export type ColorPickerFieldOutput = string | NullableValue
