import type { AutoCompleteFieldOutput } from '../fields/auto-complete/types'
import type { CheckboxCardFieldOutput } from '../fields/checkbox-card/types'
import type { CheckboxGroupFieldOutput } from '../fields/checkbox-group/types'
import type { CheckboxFieldOutput } from '../fields/checkbox/types'
import type { ColorPickerFieldOutput } from '../fields/color-picker/types'
import type { CustomComponentFieldOutput } from '../fields/custom-component/types'
import type {
  DateRangeFieldOutput,
  DateTimeFieldOutput,
  DateTimeRangeFieldOutput,
  MonthFieldOutput,
  MonthRangeFieldOutput,
  YearFieldOutput,
} from '../fields/date-family/types'
import type { DateFieldOutput } from '../fields/date/types'
import type { FileFieldOutput } from '../fields/file/types'
import type { HiddenFieldOutput } from '../fields/hidden/types'
import type { HierarchyFieldOutput } from '../fields/hierarchy/types'
import type { NumberFieldOutput } from '../fields/number/types'
import type { ObjectFieldOutput } from '../fields/object/types'
import type { OneTimeCodeFieldOutput } from '../fields/one-time-code/types'
import type { PasswordFieldOutput } from '../fields/password/types'
import type { PhoneNumberFieldOutput } from '../fields/phone-number/types'
import type { RadioCardFieldOutput } from '../fields/radio-card/types'
import type { RadioFieldOutput } from '../fields/radio/types'
import type { RatingFieldOutput } from '../fields/rating/types'
import type { SelectFieldOutput } from '../fields/select/types'
import type { SliderFieldOutput } from '../fields/slider/types'
import type { SwitchGroupFieldOutput } from '../fields/switch-group/types'
import type { SwitchFieldOutput } from '../fields/switch/types'
import type { TagFieldOutput } from '../fields/tag/types'
import type { TextFieldOutput } from '../fields/text/types'
import type { TextareaFieldOutput } from '../fields/textarea/types'
import type { TimeFieldOutput } from '../fields/time/types'
import type { UploadFieldOutput } from '../fields/upload/types'
import type { FormValue } from './'
export type { FormStateMode, NullableValue } from './field-output-utils'
export type { ObjectFieldOutput } from '../fields/object/types'
export type { ArrayListFieldOutput } from '../fields/array-list/types'
export type { ArrayTableFieldOutput } from '../fields/array-table/types'
export type { ArrayTabsFieldOutput } from '../fields/array-tabs/types'
export type { ArrayVariantFieldOutput } from '../fields/array-variant/types'
export type { GroupFieldOutput } from '../fields/group/types'
export type { MatrixFieldOutput } from '../fields/matrix/types'

/* eslint-disable */
export type ResolveFormFieldValue<TField> = TField extends { type: 'text' }
  ? TextFieldOutput
  : TField extends { type: 'password' }
    ? PasswordFieldOutput
    : TField extends { type: 'textarea' }
      ? TextareaFieldOutput
      : TField extends { type: 'number' }
        ? NumberFieldOutput
        : TField extends { type: 'auto-complete' }
          ? AutoCompleteFieldOutput<TField>
          : TField extends { type: 'checkbox' }
            ? CheckboxFieldOutput
            : TField extends { type: 'switch' }
              ? SwitchFieldOutput<TField>
              : TField extends { type: 'switch-group' }
                ? SwitchGroupFieldOutput<TField>
                : TField extends { type: 'radio' }
                  ? RadioFieldOutput<TField>
                  : TField extends { type: 'radio-card' }
                    ? RadioCardFieldOutput<TField>
                    : TField extends { type: 'checkbox-group' }
                      ? CheckboxGroupFieldOutput<TField>
                      : TField extends { type: 'checkbox-card' }
                        ? CheckboxCardFieldOutput<TField>
                        : TField extends { type: 'select' }
                          ? SelectFieldOutput<TField>
                          : TField extends { type: 'phone-number' }
                            ? PhoneNumberFieldOutput
                            : TField extends { type: 'hidden' }
                              ? HiddenFieldOutput<TField>
                              : TField extends { type: 'custom-component' }
                                ? CustomComponentFieldOutput<TField>
                                : TField extends { type: 'file' }
                                  ? FileFieldOutput<TField>
                                  : TField extends { type: 'upload' }
                                    ? UploadFieldOutput<TField>
                                    : TField extends { type: 'slider' }
                                      ? SliderFieldOutput<TField>
                                      : TField extends { type: 'color-picker' }
                                        ? ColorPickerFieldOutput
                                        : TField extends { type: 'one-time-code' }
                                          ? OneTimeCodeFieldOutput
                                          : TField extends { type: 'tag' }
                                            ? TagFieldOutput
                                            : TField extends { type: 'rating' }
                                              ? RatingFieldOutput
                                              : TField extends { type: 'date' }
                                                ? DateFieldOutput
                                                : TField extends { type: 'datetime' }
                                                  ? DateTimeFieldOutput
                                                  : TField extends { type: 'daterange' }
                                                    ? DateRangeFieldOutput
                                                    : TField extends { type: 'monthrange' }
                                                      ? MonthRangeFieldOutput
                                                      : TField extends { type: 'datetimerange' }
                                                        ? DateTimeRangeFieldOutput
                                                        : TField extends { type: 'month' }
                                                          ? MonthFieldOutput
                                                          : TField extends { type: 'year' }
                                                            ? YearFieldOutput
                                                            : TField extends { type: 'time' }
                                                              ? TimeFieldOutput
                                                              : TField extends {
                                                                    type:
                                                                      | 'tree-select'
                                                                      | 'cascader'
                                                                      | 'tree'
                                                                  }
                                                                ? HierarchyFieldOutput<TField>
                                                                : TField extends { type: 'object' }
                                                                  ? ObjectFieldOutput<FormValue>
                                                                  : FormValue
/* eslint-enable */

export type ExtractFormFieldInternalValue<TField> = ResolveFormFieldValue<TField>
