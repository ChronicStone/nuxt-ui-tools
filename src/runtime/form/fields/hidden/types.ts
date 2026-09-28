import type { FormValue } from '../../types'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldDefaultValue, FallbackNever } from '../../types/field-output-utils'

export type FormHiddenField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> = Pick<
  FormStatefulFieldBase<'hidden', FormValue, TContext, TDeps>,
  | 'key'
  | 'type'
  | 'default'
  | 'dependencies'
  | 'condition'
  | 'validation'
  | 'transform'
  | 'submit'
  | 'ignore'
  | 'watch'
  | 'watchOptions'
  | 'onDependencyChange'
  | 'onRendered'
  | 'stateEffect'
>

type TransformInputResult<TField> = TField extends {
  transform: { input: (...params: never[]) => infer TResult }
}
  ? TResult
  : never

/** A hidden field holds its default, or what its `transform.input` makes of the input. */
export type HiddenFieldOutput<TField> = FallbackNever<
  FieldDefaultValue<TField>,
  FallbackNever<TransformInputResult<TField>, FormValue>
>
