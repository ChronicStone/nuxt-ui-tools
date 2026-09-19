import type { FormArrayListField } from '../array-list/types'

export interface FormArrayTableField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends Omit<FormArrayListField<TContext, TDeps>, 'type'> {
  type: 'array-table'
  minWidth?: number | string
}

export type ArrayTableFieldOutput<TChildren> = readonly TChildren[]
