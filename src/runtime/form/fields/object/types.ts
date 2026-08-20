import type { FormValue } from '../../types'
import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormTransformConfig } from '../../types/transform'

export interface FormObjectField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'object',
  TContext,
  TDeps
> {
  transform?: FormTransformConfig<FormValue, FormValue, TContext, TDeps>
}

export type ObjectFieldOutput<TChildren> = TChildren
