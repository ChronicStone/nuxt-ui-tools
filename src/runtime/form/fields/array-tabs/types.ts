import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'
import type { FormArrayFieldActions } from '../array-list/types'

export interface FormArrayTabsField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'array-tabs',
  TContext,
  TDeps
> {
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  actions?: FormArrayFieldActions
}

export type ArrayTabsFieldOutput<TChildren> = readonly TChildren[]
