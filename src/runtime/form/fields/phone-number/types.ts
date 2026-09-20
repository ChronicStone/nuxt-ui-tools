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

export interface FormPhoneNumberProps {
  countryCodes?: readonly CountryCode[] | ((option: FormPhoneCountryOption) => boolean)
  defaultCountryCode?: 'detect' | CountryCode
  storedCountryCode?: CountryCode
  numberType?: readonly NumberType[]
  format?: 'international' | 'national' | 'uri' | 'e164'
  displayFormat?: 'national' | 'raw'
  validityIndicator?: boolean
  resetOnCountryChange?: boolean
  clearable?: boolean
}

export type FormPhoneNumberField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'phone-number', string | null, TContext, TDeps, FormPhoneNumberProps>

export type PhoneNumberFieldOutput = string | NullableValue
