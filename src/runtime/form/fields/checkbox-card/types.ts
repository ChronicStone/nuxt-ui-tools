import type { FormCheckboxGroupField, CheckboxGroupFieldOutput } from '../checkbox-group/types'

export interface FormCheckboxCardField<TContext = {}, TDeps = {}> extends Omit<
  FormCheckboxGroupField<TContext, TDeps>,
  'type' | 'variant'
> {
  type: 'checkbox-card'
  indicator?: 'start' | 'end' | 'hidden'
}

export type CheckboxCardFieldOutput<TField> = CheckboxGroupFieldOutput<TField>
