import type { CountryCode, NumberType } from 'libphonenumber-js'

import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormPhoneCountryOption {
  code: CountryCode
  value: CountryCode
  label: string
  dialCode: string
  flag: string
}

export interface FormPhoneNumberField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'phone-number',
  string | null,
  TContext,
  TDeps
> {
  countryCodes?: readonly CountryCode[] | ((option: FormPhoneCountryOption) => boolean)
  defaultCountryCode?: 'detect' | CountryCode
  storedCountryCode?: CountryCode
  numberType?: readonly NumberType[]
  format?: 'international' | 'national' | 'uri' | 'e164'
  resetOnCountryChange?: boolean
  clearable?: boolean
}

export type PhoneNumberFieldOutput = string | NullableValue
