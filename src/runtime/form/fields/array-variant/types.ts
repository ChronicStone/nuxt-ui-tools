import type { FormFieldCallback } from '../../types/callbacks'
import type { FormField } from '../../types/field'
import type { FormFieldProps } from '../../types/field-base'
import type { FormContainerLayout } from '../../types/layout'
import type { FormObject, FormText } from '../../types/utils'
import type {
  FormArrayFieldActions,
  FormArrayListProps,
  FormArrayVirtualFields,
} from '../array-list/types'

export interface FormArrayVariant<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> {
  key: string | number
  label: FormText
  fields: readonly FormField<TContext, TDeps>[]
  virtualFields?: FormArrayVirtualFields
}

export interface FormArrayVariantProps extends FormArrayListProps {
  displayMode?: 'list' | 'tabs'
}

export interface FormArrayVariantField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> {
  key: string
  type: 'array-variant'
  label?: FormText
  description?: FormText
  layout?: FormContainerLayout
  condition?: FormFieldCallback<boolean, TContext, TDeps>
  ignore?: boolean
  props?: FormFieldProps<FormArrayVariantProps, TContext, TDeps>
  variantKey: string
  variants: readonly FormArrayVariant<TContext, TDeps>[]
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  confirmDelete?: boolean | FormText
  headerTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
  transformOnCreate?: (item: FormObject, index: number, deps: TDeps) => FormObject
  extraProperties?: boolean
  actions?: FormArrayFieldActions<TContext, TDeps>
}

export type ArrayVariantFieldOutput<TChildren> = readonly TChildren[]
