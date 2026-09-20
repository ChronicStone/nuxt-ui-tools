import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormText, FormObject } from '../../types/utils'
import type { FormArrayListField, FormArrayListProps } from '../array-list/types'

export type FormArrayCollapseExpanded = 'all' | 'none' | 'first'

export interface FormArrayCollapseProps extends FormArrayListProps {
  accordion?: boolean
  defaultExpanded?: FormArrayCollapseExpanded
  arrowPlacement?: 'left' | 'right'
}

export interface FormArrayCollapseField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
>
  extends
    Omit<FormArrayListField<TContext, TDeps>, 'type' | 'props'>,
    Pick<
      FormContainerFieldBase<'array-collapse', TContext, TDeps, FormArrayCollapseProps>,
      'type' | 'props'
    > {
  summaryTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
}

export type ArrayCollapseFieldOutput<TChildren> = readonly TChildren[]
