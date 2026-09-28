import type { RemoteOptionsLoader } from '../../shared/types/remote-options'
import type { DataTag, QueryKey } from './context'
import type { FormOptionValue } from './options'

export type FormStateMode = 'internal' | 'output' | 'input'
export type NullableValue = null

export type FieldProps<TField> = TField extends { readonly props: infer TProps }
  ? TProps extends (...args: never[]) => infer TResult
    ? TResult
    : TProps
  : NonNullable<unknown>

export type AwaitedValue<TValue> = TValue extends Promise<infer TResolved> ? TResolved : TValue

export type FallbackNever<TValue, TFallback> = [TValue] extends [never] ? TFallback : TValue

export type FunctionReturn<TValue> = TValue extends (...params: infer _TParams) => infer TResult
  ? TResult
  : never

export type DynamicValue<TValue> = TValue extends (...params: infer _TParams) => infer TResult
  ? TResult
  : TValue

type QuerySelectedValue<TValue> = TValue extends { select?: infer TSelect }
  ? FunctionReturn<Exclude<TSelect, undefined>>
  : never

type QueryFunctionValue<TValue> = TValue extends { queryFn?: infer TQueryFn }
  ? AwaitedValue<FunctionReturn<Exclude<TQueryFn, undefined>>>
  : never

export type QueryOptionsValue<TValue> = [TValue] extends [{ queryKey: infer TQueryKey }]
  ? [QuerySelectedValue<TValue>] extends [never]
    ? TQueryKey extends DataTag<QueryKey, infer TResult, infer _TError>
      ? TResult
      : QueryFunctionValue<TValue>
    : QuerySelectedValue<TValue>
  : TValue

/** Options a remote loader resolves, so a remote select is typed by the values it offers. */
type RemoteLoaderOptions<TLoader> =
  TLoader extends RemoteOptionsLoader<infer TOption> ? readonly TOption[] : never

export type OptionSource<TField> = TField extends { options: infer TOptions }
  ? TOptions extends { loader: infer TLoader }
    ? RemoteLoaderOptions<TLoader>
    : TOptions extends { source: infer TSource }
      ? TSource
      : TOptions
  : never

export type OptionSourceValue<TSource> = TSource extends (
  ...params: infer _TParams
) => infer TResult
  ? QueryOptionsValue<AwaitedValue<TResult>>
  : QueryOptionsValue<AwaitedValue<TSource>>

export type OptionItemFromValue<TValue> = TValue extends readonly (infer TOption)[]
  ? TOption
  : never

export type OptionItem<TField> = OptionItemFromValue<OptionSourceValue<OptionSource<TField>>>

export type OptionValue<TOption> = TOption extends { value: infer TValue }
  ? TValue
  : TOption extends { key: infer TValue }
    ? TValue
    : TOption extends FormOptionValue
      ? TOption
      : never

export type FieldOptionValue<TField> = FallbackNever<
  OptionValue<OptionItem<TField>>,
  FormOptionValue
>

export type FieldDefaultValue<TField> = TField extends { default: infer TDefault }
  ? DynamicValue<TDefault>
  : never

export type TransformOutputValue<TField, TFallback> = TField extends {
  transform: { output: infer TOutput }
}
  ? FallbackNever<AwaitedValue<FunctionReturn<TOutput>>, TFallback>
  : TFallback

/** Value a field accepts as input: what its `transform.input` takes, or its own value. */
export type TransformInputValue<TField, TFallback> = TField extends {
  transform: { input: (value: infer TInput, ...params: infer _TParams) => unknown }
}
  ? FallbackNever<TInput, TFallback>
  : TFallback
