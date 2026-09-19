import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormArrayListField, FormArrayListProps } from '../array-list/types'

export interface FormArrayTableProps extends FormArrayListProps {
  minWidth?: number | string
}

export interface FormArrayTableField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>>
  extends
    Omit<FormArrayListField<TContext, TDeps>, 'type' | 'props'>,
    Pick<
      FormContainerFieldBase<'array-table', TContext, TDeps, FormArrayTableProps>,
      'type' | 'props'
    > {}

export type ArrayTableFieldOutput<TChildren> = readonly TChildren[]
