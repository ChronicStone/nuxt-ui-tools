import { arrayListFieldKind } from './array-list/config'
import { arrayTabsFieldKind } from './array-tabs/config'
import { arrayVariantFieldKind } from './array-variant/config'
import { buttonFieldKind } from './button/config'
import { checkboxGroupFieldKind } from './checkbox-group/config'
import { checkboxFieldKind } from './checkbox/config'
import { colorPickerFieldKind } from './color-picker/config'
import { customComponentFieldKind } from './custom-component/config'
import { dateFieldKind } from './date/config'
import { dividerFieldKind } from './divider/config'
import { fileFieldKind } from './file/config'
import { hiddenFieldKind } from './hidden/config'
import { infoFieldKind } from './info/config'
import { inputGroupFieldKind } from './input-group/config'
import { numberFieldKind } from './number/config'
import { oneTimeCodeFieldKind } from './one-time-code/config'
import { objectFieldKind } from './object/config'
import { passwordFieldKind } from './password/config'
import { phoneNumberFieldKind } from './phone-number/config'
import { radioFieldKind } from './radio/config'
import { selectFieldKind } from './select/config'
import { sliderFieldKind } from './slider/config'
import { switchFieldKind } from './switch/config'
import { tagFieldKind } from './tag/config'
import { textareaFieldKind } from './textarea/config'
import { textFieldKind } from './text/config'
import { uploadFieldKind } from './upload/config'

export const formFieldKinds = [
  textFieldKind,
  passwordFieldKind,
  textareaFieldKind,
  numberFieldKind,
  checkboxFieldKind,
  radioFieldKind,
  selectFieldKind,
  dateFieldKind,
  phoneNumberFieldKind,
  hiddenFieldKind,
  infoFieldKind,
  dividerFieldKind,
  inputGroupFieldKind,
  objectFieldKind,
  customComponentFieldKind,
  fileFieldKind,
  uploadFieldKind,
  arrayListFieldKind,
  arrayTabsFieldKind,
  arrayVariantFieldKind,
  sliderFieldKind,
  tagFieldKind,
  buttonFieldKind,
  switchFieldKind,
  checkboxGroupFieldKind,
  colorPickerFieldKind,
  oneTimeCodeFieldKind,
] as const

export {
  arrayListFieldKind,
  arrayTabsFieldKind,
  arrayVariantFieldKind,
  buttonFieldKind,
  checkboxGroupFieldKind,
  checkboxFieldKind,
  colorPickerFieldKind,
  customComponentFieldKind,
  dateFieldKind,
  dividerFieldKind,
  fileFieldKind,
  hiddenFieldKind,
  infoFieldKind,
  inputGroupFieldKind,
  numberFieldKind,
  oneTimeCodeFieldKind,
  objectFieldKind,
  passwordFieldKind,
  phoneNumberFieldKind,
  radioFieldKind,
  selectFieldKind,
  sliderFieldKind,
  switchFieldKind,
  tagFieldKind,
  textareaFieldKind,
  textFieldKind,
  uploadFieldKind,
}
