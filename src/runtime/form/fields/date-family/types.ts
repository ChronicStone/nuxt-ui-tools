import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormDateFamilyCalendarOptions {
  monthControls?: boolean
  yearControls?: boolean
  weekNumbers?: boolean
  numberOfMonths?: number
  yearRange?: readonly [number, number]
}

export interface FormDateManualInputOptions {
  enabled?: boolean
  mask?: boolean
  format?: string
  placeholder?: string
}

export type FormDateManualInput = boolean | FormDateManualInputOptions

export interface FormDateFamilyProps {
  min?: string
  max?: string
  clearable?: boolean
  manualInput?: FormDateManualInput
  manualInputFormat?: string
  calendar?: FormDateFamilyCalendarOptions
}

export interface FormDateTimeProps extends FormDateFamilyProps {
  minuteStep?: number
}

export interface FormYearProps extends Pick<
  FormDateFamilyProps,
  'clearable' | 'manualInput' | 'manualInputFormat' | 'calendar'
> {
  min?: number
  max?: number
}

export type FormDateTimeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'datetime', string | null, TContext, TDeps, FormDateTimeProps>

export type FormDateRangeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<
  'daterange',
  readonly [string, string] | null,
  TContext,
  TDeps,
  FormDateFamilyProps
>

export type FormMonthRangeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<
  'monthrange',
  readonly [string, string] | null,
  TContext,
  TDeps,
  FormDateFamilyProps
>

export type FormDateTimeRangeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<
  'datetimerange',
  readonly [string, string] | null,
  TContext,
  TDeps,
  FormDateTimeProps
>

export type FormMonthField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'month', string | null, TContext, TDeps, FormDateFamilyProps>

export type FormYearField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'year', string | null, TContext, TDeps, FormYearProps>

export type DateTimeFieldOutput = string | NullableValue
export type DateRangeFieldOutput = readonly [string, string] | NullableValue
export type MonthRangeFieldOutput = readonly [string, string] | NullableValue
export type DateTimeRangeFieldOutput = readonly [string, string] | NullableValue
export type MonthFieldOutput = string | NullableValue
export type YearFieldOutput = string | NullableValue

export type FormDateFamilyField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> =
  | FormDateTimeField<TContext, TDeps>
  | FormDateRangeField<TContext, TDeps>
  | FormMonthRangeField<TContext, TDeps>
  | FormDateTimeRangeField<TContext, TDeps>
  | FormMonthField<TContext, TDeps>
  | FormYearField<TContext, TDeps>
