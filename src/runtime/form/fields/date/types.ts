import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormDateFamilyCalendarOptions, FormDateManualInput } from '../date-family/types'

export type { FormDateFamilyCalendarOptions as FormDateCalendarOptions } from '../date-family/types'

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
  manualInput?: FormDateManualInput
  manualInputFormat?: string
  calendar?: FormDateFamilyCalendarOptions
}

export type DateFieldOutput = Date | string | NullableValue
