import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormArrayFieldActions {
  addItem?: boolean
  deleteItem?: boolean
  moveUp?: boolean
  moveDown?: boolean
}

export interface FormArrayListField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'array-list',
  TContext,
  TDeps
> {
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  actions?: FormArrayFieldActions
}

export type ArrayListFieldOutput<TChildren> = readonly TChildren[]
