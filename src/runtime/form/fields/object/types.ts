import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormTransformConfig } from '../../types/transform'

export interface FormObjectField<TContext = {}, TDeps = {}>
  extends FormContainerFieldBase<'object', TContext, TDeps> {
  transform?: FormTransformConfig<unknown, unknown, TContext, TDeps>
}

export type ObjectFieldOutput<TChildren> = TChildren
