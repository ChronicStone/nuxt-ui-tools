import type { FormText, FormObject } from '../../types/utils'
import type { FormArrayListField } from '../array-list/types'

export type FormArrayCollapseExpanded = 'all' | 'none' | 'first'

export interface FormArrayCollapseField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends Omit<FormArrayListField<TContext, TDeps>, 'type'> {
  type: 'array-collapse'
  accordion?: boolean
  defaultExpanded?: FormArrayCollapseExpanded
  arrowPlacement?: 'left' | 'right'
  summaryTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
}

export type ArrayCollapseFieldOutput<TChildren> = readonly TChildren[]
