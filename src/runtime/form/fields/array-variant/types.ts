import type { FormFieldCallback } from '../../types/callbacks'
import type { FormField } from '../../types/field'
import type { FormContainerLayout } from '../../types/layout'
import type { FormDynamic, FormObject, FormText } from '../../types/utils'
import type { FormArrayFieldActions, FormArrayVirtualFields } from '../array-list/types'

export interface FormArrayVariant<TContext = {}, TDeps = {}> {
  key: string | number
  label: FormText
  fields: readonly FormField<TContext, TDeps>[]
  virtualFields?: FormArrayVirtualFields
}

export interface FormArrayVariantField<TContext = {}, TDeps = {}> {
  key: string
  type: 'array-variant'
  label?: FormText
  description?: FormText
  layout?: FormContainerLayout
  condition?: FormFieldCallback<boolean, TContext, TDeps>
  ignore?: boolean
  props?: FormDynamic<FormObject, { ctx: TContext; deps: TDeps }>
  variantKey: string
  variants: readonly FormArrayVariant<TContext, TDeps>[]
  displayMode?: 'list' | 'tabs'
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  draggable?: boolean
  confirmDelete?: boolean | FormText
  headerTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
  transformOnCreate?: (item: FormObject, index: number, deps: TDeps) => FormObject
  extraProperties?: boolean
  actions?: FormArrayFieldActions<TContext, TDeps>
}

export type ArrayVariantFieldOutput<TChildren> = readonly TChildren[]
