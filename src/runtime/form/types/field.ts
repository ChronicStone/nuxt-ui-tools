import type { FormArrayListField } from '../fields/array-list/types'
import type { FormArrayTabsField } from '../fields/array-tabs/types'
import type { FormArrayVariantField } from '../fields/array-variant/types'
import type { FormButtonField } from '../fields/button/types'
import type { FormCheckboxField } from '../fields/checkbox/types'
import type { FormCustomComponentField } from '../fields/custom-component/types'
import type { FormDateField } from '../fields/date/types'
import type { FormDividerField } from '../fields/divider/types'
import type { FormFileField } from '../fields/file/types'
import type { FormHiddenField } from '../fields/hidden/types'
import type { FormInfoField } from '../fields/info/types'
import type { FormInputGroupField } from '../fields/input-group/types'
import type { FormNumberField } from '../fields/number/types'
import type { FormObjectField } from '../fields/object/types'
import type { FormPasswordField } from '../fields/password/types'
import type { FormRadioField } from '../fields/radio/types'
import type { FormSelectField } from '../fields/select/types'
import type { FormSliderField } from '../fields/slider/types'
import type { FormTagField } from '../fields/tag/types'
import type { FormTextField } from '../fields/text/types'
import type { FormTextareaField } from '../fields/textarea/types'
import type { FormUploadField } from '../fields/upload/types'

export type {
  FormContainerFieldBase,
  FormFieldType,
  FormStatefulFieldBase,
  FormStatelessFieldBase,
} from './field-base'
export type { FormArrayListField } from '../fields/array-list/types'
export type { FormArrayTabsField } from '../fields/array-tabs/types'
export type { FormArrayVariantField } from '../fields/array-variant/types'
export type { FormButtonField } from '../fields/button/types'
export type { FormCheckboxField } from '../fields/checkbox/types'
export type { FormCustomComponentField } from '../fields/custom-component/types'
export type { FormDateField } from '../fields/date/types'
export type { FormDividerField } from '../fields/divider/types'
export type { FormFileField } from '../fields/file/types'
export type { FormHiddenField } from '../fields/hidden/types'
export type { FormInfoField } from '../fields/info/types'
export type { FormInputGroupField } from '../fields/input-group/types'
export type { FormNumberField } from '../fields/number/types'
export type { FormObjectField } from '../fields/object/types'
export type { FormPasswordField } from '../fields/password/types'
export type { FormRadioField } from '../fields/radio/types'
export type { FormSelectField } from '../fields/select/types'
export type { FormSliderField } from '../fields/slider/types'
export type { FormTagField } from '../fields/tag/types'
export type { FormTextField } from '../fields/text/types'
export type { FormTextareaField } from '../fields/textarea/types'
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
  | FormCheckboxField<TContext, TDeps>
  | FormRadioField<TContext, TDeps>
  | FormSelectField<TContext, TDeps>
  | FormDateField<TContext, TDeps>
  | FormHiddenField<TContext, TDeps>
  | FormInfoField<TContext, TDeps>
  | FormDividerField<TContext, TDeps>
  | FormInputGroupField<TContext, TDeps>
  | FormObjectField<TContext, TDeps>
  | FormCustomComponentField<TContext, TDeps>
  | FormFileField<TContext, TDeps>
  | FormUploadField<TContext, TDeps>
  | FormArrayListField<TContext, TDeps>
  | FormArrayTabsField<TContext, TDeps>
  | FormArrayVariantField<TContext, TDeps>
  | FormSliderField<TContext, TDeps>
  | FormTagField<TContext, TDeps>
  | FormButtonField<TContext, TDeps>
