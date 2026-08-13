import type { FormArrayListField } from '../fields/array-list/types'
import type { FormArrayTableField } from '../fields/array-table/types'
import type { FormArrayTabsField } from '../fields/array-tabs/types'
import type { FormArrayVariantField } from '../fields/array-variant/types'
import type { FormAutoCompleteField } from '../fields/auto-complete/types'
import type { FormButtonField } from '../fields/button/types'
import type { FormCardField } from '../fields/card/types'
import type { FormCheckboxCardField } from '../fields/checkbox-card/types'
import type { FormCheckboxGroupField } from '../fields/checkbox-group/types'
import type { FormCheckboxField } from '../fields/checkbox/types'
import type { FormColorPickerField } from '../fields/color-picker/types'
import type { FormColumnField } from '../fields/column/types'
import type { FormCustomComponentField } from '../fields/custom-component/types'
import type {
  FormDateRangeField,
  FormDateTimeField,
  FormDateTimeRangeField,
  FormMonthField,
  FormMonthRangeField,
  FormYearField,
} from '../fields/date-family/types'
import type { FormDateField } from '../fields/date/types'
import type { FormDividerField } from '../fields/divider/types'
import type { FormFileField } from '../fields/file/types'
import type { FormGroupField } from '../fields/group/types'
import type { FormHiddenField } from '../fields/hidden/types'
import type {
  FormCascaderField,
  FormTreeField,
  FormTreeSelectField,
} from '../fields/hierarchy/types'
import type { FormInfoField } from '../fields/info/types'
import type { FormInputGroupField } from '../fields/input-group/types'
import type { FormMatrixField } from '../fields/matrix/types'
import type { FormNumberField } from '../fields/number/types'
import type { FormObjectField } from '../fields/object/types'
import type { FormOneTimeCodeField } from '../fields/one-time-code/types'
import type { FormPasswordField } from '../fields/password/types'
import type { FormPhoneNumberField } from '../fields/phone-number/types'
import type { FormRadioCardField } from '../fields/radio-card/types'
import type { FormRadioField } from '../fields/radio/types'
import type { FormRatingField } from '../fields/rating/types'
import type { FormSelectField } from '../fields/select/types'
import type { FormSliderField } from '../fields/slider/types'
import type { FormSwitchGroupField } from '../fields/switch-group/types'
import type { FormSwitchField } from '../fields/switch/types'
import type { FormTagField } from '../fields/tag/types'
import type { FormTextField } from '../fields/text/types'
import type { FormTextareaField } from '../fields/textarea/types'
import type { FormTimeField } from '../fields/time/types'
import type { FormUploadField } from '../fields/upload/types'

export type {
  FormContainerFieldBase,
  FormFieldType,
  FormStatefulFieldBase,
  FormStatelessFieldBase,
} from './field-base'
export type { FormArrayListField } from '../fields/array-list/types'
export type { FormArrayTableField } from '../fields/array-table/types'
export type { FormArrayTabsField } from '../fields/array-tabs/types'
export type { FormArrayVariantField } from '../fields/array-variant/types'
export type { FormAutoCompleteField } from '../fields/auto-complete/types'
export type { FormButtonField } from '../fields/button/types'
export type { FormCardField } from '../fields/card/types'
export type { FormCheckboxCardField } from '../fields/checkbox-card/types'
export type { FormCheckboxField } from '../fields/checkbox/types'
export type { FormCheckboxGroupField } from '../fields/checkbox-group/types'
export type { FormColorPickerField } from '../fields/color-picker/types'
export type { FormColumnField } from '../fields/column/types'
export type { FormCustomComponentField } from '../fields/custom-component/types'
export type { FormDateField } from '../fields/date/types'
export type {
  FormDateFamilyField,
  FormDateRangeField,
  FormDateTimeField,
  FormDateTimeRangeField,
  FormMonthField,
  FormMonthRangeField,
  FormYearField,
} from '../fields/date-family/types'
export type { FormDividerField } from '../fields/divider/types'
export type { FormFileField } from '../fields/file/types'
export type { FormHiddenField } from '../fields/hidden/types'
export type { FormGroupField } from '../fields/group/types'
export type {
  FormCascaderField,
  FormHierarchyField,
  FormHierarchyOption,
  FormTreeField,
  FormTreeSelectField,
} from '../fields/hierarchy/types'
export type { FormInfoField } from '../fields/info/types'
export type { FormInputGroupField } from '../fields/input-group/types'
export type { FormMatrixField, FormMatrixRow } from '../fields/matrix/types'
export type { FormNumberField } from '../fields/number/types'
export type { FormOneTimeCodeField } from '../fields/one-time-code/types'
export type { FormObjectField } from '../fields/object/types'
export type { FormPasswordField } from '../fields/password/types'
export type { FormPhoneNumberField } from '../fields/phone-number/types'
export type { FormRadioCardField } from '../fields/radio-card/types'
export type { FormRadioField } from '../fields/radio/types'
export type { FormRatingField } from '../fields/rating/types'
export type { FormSelectCreateItem, FormSelectField } from '../fields/select/types'
export type { FormSliderField } from '../fields/slider/types'
export type { FormSwitchGroupField } from '../fields/switch-group/types'
export type { FormSwitchField } from '../fields/switch/types'
export type { FormTagField } from '../fields/tag/types'
export type { FormTextField } from '../fields/text/types'
export type { FormTextareaField } from '../fields/textarea/types'
export type { FormTimeField } from '../fields/time/types'
export type { FormUploadField } from '../fields/upload/types'

/**
 * Union of authored form fields.
 *
 * Individual field schema contracts live beside their field implementation in
 * `src/runtime/form/fields/<kind>/types.ts`; this file only assembles the public union.
 */
export type FormField<TContext = {}, TDeps = {}> =
  | FormTextField<TContext, TDeps>
  | FormPasswordField<TContext, TDeps>
  | FormTextareaField<TContext, TDeps>
  | FormNumberField<TContext, TDeps>
  | FormAutoCompleteField<TContext, TDeps>
  | FormCheckboxField<TContext, TDeps>
  | FormSwitchField<TContext, TDeps>
  | FormSwitchGroupField<TContext, TDeps>
  | FormRadioField<TContext, TDeps>
  | FormRadioCardField<TContext, TDeps>
  | FormCheckboxGroupField<TContext, TDeps>
  | FormCheckboxCardField<TContext, TDeps>
  | FormSelectField<TContext, TDeps>
  | FormDateField<TContext, TDeps>
  | FormDateTimeField<TContext, TDeps>
  | FormDateRangeField<TContext, TDeps>
  | FormMonthRangeField<TContext, TDeps>
  | FormDateTimeRangeField<TContext, TDeps>
  | FormMonthField<TContext, TDeps>
  | FormYearField<TContext, TDeps>
  | FormTimeField<TContext, TDeps>
  | FormTreeSelectField<TContext, TDeps>
  | FormCascaderField<TContext, TDeps>
  | FormTreeField<TContext, TDeps>
  | FormPhoneNumberField<TContext, TDeps>
  | FormHiddenField<TContext, TDeps>
  | FormInfoField<TContext, TDeps>
  | FormDividerField<TContext, TDeps>
  | FormInputGroupField<TContext, TDeps>
  | FormGroupField<TContext, TDeps>
  | FormObjectField<TContext, TDeps>
  | FormMatrixField<TContext, TDeps>
  | FormCustomComponentField<TContext, TDeps>
  | FormFileField<TContext, TDeps>
  | FormUploadField<TContext, TDeps>
  | FormArrayListField<TContext, TDeps>
  | FormArrayTableField<TContext, TDeps>
  | FormArrayTabsField<TContext, TDeps>
  | FormArrayVariantField<TContext, TDeps>
  | FormSliderField<TContext, TDeps>
  | FormColorPickerField<TContext, TDeps>
  | FormOneTimeCodeField<TContext, TDeps>
  | FormRatingField<TContext, TDeps>
  | FormTagField<TContext, TDeps>
  | FormButtonField<TContext, TDeps>
  | FormCardField<TContext, TDeps>
  | FormColumnField<TContext, TDeps>
