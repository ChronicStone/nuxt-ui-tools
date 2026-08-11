import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'
import type { FormArrayFieldActions } from '../array-list/types'

export interface FormArrayVariantField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'array-variant',
  TContext,
  TDeps
> {
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  actions?: FormArrayFieldActions
}

export type ArrayVariantFieldOutput<TChildren> = readonly TChildren[]
