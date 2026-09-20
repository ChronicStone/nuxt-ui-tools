import type { FormStatefulFieldBase } from '../../types/field-base'

export interface FormTagField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'tag', readonly string[], TContext, TDeps> {}

export type TagFieldOutput = readonly string[]
