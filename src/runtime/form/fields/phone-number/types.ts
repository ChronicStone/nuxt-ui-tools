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
  /** Stored/submitted value format. Defaults to international. */
  format?: 'international' | 'national' | 'uri' | 'e164'
  /** How a valid number is rendered back into the editable input. Defaults to national. */
  displayFormat?: 'national' | 'raw'
  /** Shows the trailing valid/invalid indicator while a value is present. Defaults to true. */
  validityIndicator?: boolean
  resetOnCountryChange?: boolean
  clearable?: boolean
}

export type PhoneNumberFieldOutput = string | NullableValue
