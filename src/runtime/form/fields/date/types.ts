import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormDateFamilyCalendarOptions, FormDateManualInput } from '../date-family/types'

export type { FormDateFamilyCalendarOptions as FormDateCalendarOptions } from '../date-family/types'

export interface FormDateProps {
  min?: Date | string
  max?: Date | string
  clearable?: boolean
  outputFormat?: 'iso' | 'date'
  previewFormat?: Intl.DateTimeFormatOptions
  manualInput?: FormDateManualInput
  manualInputFormat?: string
  calendar?: FormDateFamilyCalendarOptions
}

export type FormDateField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'date', Date | string | null, TContext, TDeps, FormDateProps>

/** A date field submits its canonical `YYYY-MM-DD` value, or a `Date` with `outputFormat: 'date'`. */
export type DateFieldOutput<TField> = TField extends { props: { outputFormat: 'date' } }
  ? Date | NullableValue
  : string | NullableValue
