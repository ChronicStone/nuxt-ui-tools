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

export interface FormDateFamilyOptions {
  min?: string
  max?: string
  clearable?: boolean
  manualInput?: FormDateManualInput
  manualInputFormat?: string
  calendar?: FormDateFamilyCalendarOptions
}

export interface FormDateTimeField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'datetime', string | null, TContext, TDeps>, FormDateFamilyOptions {
  minuteStep?: number
}

export interface FormDateRangeField<TContext = {}, TDeps = {}>
  extends
    FormStatefulFieldBase<'daterange', readonly [string, string] | null, TContext, TDeps>,
    FormDateFamilyOptions {}

export interface FormMonthRangeField<TContext = {}, TDeps = {}>
  extends
    FormStatefulFieldBase<'monthrange', readonly [string, string] | null, TContext, TDeps>,
    FormDateFamilyOptions {}

export interface FormDateTimeRangeField<TContext = {}, TDeps = {}>
  extends
    FormStatefulFieldBase<'datetimerange', readonly [string, string] | null, TContext, TDeps>,
    FormDateFamilyOptions {
  minuteStep?: number
}

export interface FormMonthField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'month', string | null, TContext, TDeps>, FormDateFamilyOptions {}

export interface FormYearField<TContext = {}, TDeps = {}>
  extends
    FormStatefulFieldBase<'year', string | null, TContext, TDeps>,
    Pick<FormDateFamilyOptions, 'clearable' | 'manualInput' | 'manualInputFormat' | 'calendar'> {
  min?: number
  max?: number
}

export type DateTimeFieldOutput = string | NullableValue
export type DateRangeFieldOutput = readonly [string, string] | NullableValue
export type MonthRangeFieldOutput = readonly [string, string] | NullableValue
export type DateTimeRangeFieldOutput = readonly [string, string] | NullableValue
export type MonthFieldOutput = string | NullableValue
export type YearFieldOutput = string | NullableValue

export type FormDateFamilyField<TContext = {}, TDeps = {}> =
  | FormDateTimeField<TContext, TDeps>
  | FormDateRangeField<TContext, TDeps>
  | FormMonthRangeField<TContext, TDeps>
  | FormDateTimeRangeField<TContext, TDeps>
  | FormMonthField<TContext, TDeps>
  | FormYearField<TContext, TDeps>
