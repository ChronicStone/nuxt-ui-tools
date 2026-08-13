import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'
import type { FormObject } from '../../types/utils'
import type { FormArrayFieldActions, FormArrayVirtualFields } from '../array-list/types'

export interface FormArrayTabsField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'array-tabs',
  TContext,
  TDeps
> {
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  confirmDelete?: boolean | FormText
  headerTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
  transformOnCreate?: (item: FormObject, index: number, deps: TDeps) => FormObject
  virtualFields?: FormArrayVirtualFields
  extraProperties?: boolean
  actions?: FormArrayFieldActions<TContext, TDeps>
}

export type ArrayTabsFieldOutput<TChildren> = readonly TChildren[]
