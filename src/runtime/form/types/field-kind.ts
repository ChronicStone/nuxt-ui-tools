import type { FormFieldType } from './field-base'

/**
 * Describes how a field kind participates in form state and runtime features.
 */
export interface FormFieldKindDefinition<TType extends FormFieldType = FormFieldType> {
  /** Field type handled by this kind. */
  type: TType
  /** Runtime state model used by this field. */
  state: 'stateful' | 'stateless' | 'passthrough'
  /** Whether the field renders label/description/hint chrome. */
  ui?: {
    label?: boolean
    description?: boolean
    hint?: boolean
  }
  /** Whether the field participates in item or container layout. */
  layout?: {
    item?: boolean
    container?: boolean
  }
  /** Whether the field owns option resolution. */
  options?: {
    enabled: boolean
  }
  /** Whether the field owns file upload work. */
  upload?: {
    enabled: boolean
  }
  /** Whether the field can validate its value. */
  validation?: boolean
  /** Whether the field supports input/output transforms. */
  transform?: boolean
}

export type FormFieldKindState = FormFieldKindDefinition['state']
export type FormFieldState = FormFieldKindState
export type FormFieldCapability =
  | 'value'
  | 'children'
  | 'label'
  | 'description'
  | 'hint'
  | 'layout'
  | 'itemLayout'
  | 'containerLayout'
  | 'options'
  | 'upload'
  | 'validation'
  | 'transform'
  | 'submit'
