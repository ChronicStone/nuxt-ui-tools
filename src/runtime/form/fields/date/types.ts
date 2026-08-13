import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormDateCalendarOptions {
  monthControls?: boolean
  yearControls?: boolean
  weekNumbers?: boolean
  yearRange?: readonly [number, number]
}

export interface FormDateField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'date',
  Date | string | null,
  TContext,
  TDeps
> {
  min?: Date | string
  max?: Date | string
  clearable?: boolean
  outputFormat?: 'iso' | 'date'
  previewFormat?: Intl.DateTimeFormatOptions
  manualInput?: {
    enabled?: boolean
    format?: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd'
    placeholder?: string
  }
  calendar?: FormDateCalendarOptions
}

export type DateFieldOutput = Date | string | NullableValue
