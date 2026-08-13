import { arrayListFieldKind } from './array-list/config'
import { arrayTabsFieldKind } from './array-tabs/config'
import { arrayVariantFieldKind } from './array-variant/config'
import { autoCompleteFieldKind } from './auto-complete/config'
import { buttonFieldKind } from './button/config'
import { cardFieldKind } from './card/config'
import { checkboxCardFieldKind } from './checkbox-card/config'
import { checkboxGroupFieldKind } from './checkbox-group/config'
import { checkboxFieldKind } from './checkbox/config'
import { colorPickerFieldKind } from './color-picker/config'
import { columnFieldKind } from './column/config'
import { customComponentFieldKind } from './custom-component/config'
import { dateFieldKind } from './date/config'
import { dividerFieldKind } from './divider/config'
import { fileFieldKind } from './file/config'
import { hiddenFieldKind } from './hidden/config'
import { infoFieldKind } from './info/config'
import { inputGroupFieldKind } from './input-group/config'
import { numberFieldKind } from './number/config'
import { objectFieldKind } from './object/config'
import { oneTimeCodeFieldKind } from './one-time-code/config'
import { passwordFieldKind } from './password/config'
import { phoneNumberFieldKind } from './phone-number/config'
import { radioCardFieldKind } from './radio-card/config'
import { radioFieldKind } from './radio/config'
import { ratingFieldKind } from './rating/config'
import { selectFieldKind } from './select/config'
import { sliderFieldKind } from './slider/config'
import { switchGroupFieldKind } from './switch-group/config'
import { switchFieldKind } from './switch/config'
import { tagFieldKind } from './tag/config'
import { textFieldKind } from './text/config'
import { textareaFieldKind } from './textarea/config'
import { timeFieldKind } from './time/config'
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
  autoCompleteFieldKind,
  radioCardFieldKind,
  checkboxCardFieldKind,
  switchGroupFieldKind,
  timeFieldKind,
  ratingFieldKind,
  cardFieldKind,
  columnFieldKind,
] as const

export {
  arrayListFieldKind,
  arrayTabsFieldKind,
  arrayVariantFieldKind,
  autoCompleteFieldKind,
  buttonFieldKind,
  cardFieldKind,
  checkboxCardFieldKind,
  checkboxGroupFieldKind,
  checkboxFieldKind,
  colorPickerFieldKind,
  columnFieldKind,
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
  radioCardFieldKind,
  radioFieldKind,
  ratingFieldKind,
  selectFieldKind,
  sliderFieldKind,
  switchGroupFieldKind,
  switchFieldKind,
  tagFieldKind,
  textareaFieldKind,
  textFieldKind,
  timeFieldKind,
  uploadFieldKind,
}
