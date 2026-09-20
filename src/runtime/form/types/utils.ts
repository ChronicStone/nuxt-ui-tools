import type { DataTag, QueryKey } from '@tanstack/vue-query'

import type {
  GenericObject,
  LazyRenderableValue,
  LazyTextValue,
  MaybePromise,
} from '../../shared/types/utils'

/**
 * Values that can be returned directly or resolved asynchronously by the form runtime.
 */
export type FormMaybePromise<TValue> = MaybePromise<TValue>

/**
 * User-facing text accepted by form schema properties.
 *
 * Lazy functions are intentionally argument-free so labels remain easy to translate from
 * i18n composables without forcing every text property into the field callback model.
 */
export type FormText = LazyTextValue

/**
 * Content rendered by stateless or decorative fields.
 */
export type FormRenderable = LazyRenderableValue

/**
 * Generic object used for UI-library props and other intentionally open extension bags.
 */
export type FormObject = GenericObject

/** Value crossing a form runtime boundary before its owning parser narrows it. */
export type FormValue = FormObject[string]

/**
 * A value that can be static or derived from the current field callback context.
 */
export type FormDynamic<TValue, TParams> = TValue | ((params: TParams) => TValue)

/**
 * Describes the normalized state of an async resource exposed on form context.
 */
export interface FormAsyncResource<TValue, TError = unknown> {
  /** Last successfully resolved value. `undefined` means no usable data is available yet. */
  value: TValue | undefined
  /** Error returned by the async source, if the current resource is in an error state. */
  error: TError | null
  /** True while the first value is loading. */
  pending: boolean
  /** True while the resource is refreshing after at least one value was already resolved. */
  fetching: boolean
  /** True when consumers should show a blocking loader for this resource. */
  loading: boolean
  /** Refreshes the resource when the source supports refresh/refetch. */
  refresh: () => Promise<void>
}

/**
 * Describes the normalized state of a synchronous context value.
 */
export interface FormSyncResource<TValue> {
  /** Current value. */
  value: TValue
}

type FormFunctionResult<TValue> = TValue extends (...params: infer _TParams) => infer TResult
  ? TResult
  : never

type FormQuerySelectedValue<TValue> = TValue extends { select?: infer TSelect }
  ? FormFunctionResult<Exclude<TSelect, undefined>>
  : never

type FormQueryFunctionValue<TValue> = TValue extends { queryFn?: infer TQueryFn }
  ? Awaited<FormFunctionResult<Exclude<TQueryFn, undefined>>>
  : never

type FormQueryResource<TValue, TQueryKey> = [FormQuerySelectedValue<TValue>] extends [never]
  ? TQueryKey extends DataTag<QueryKey, infer TResolved, infer TError>
    ? FormAsyncResource<TResolved, TError>
    : FormAsyncResource<FormQueryFunctionValue<TValue>>
  : FormAsyncResource<FormQuerySelectedValue<TValue>>

/**
 * Converts a raw context source return value into the resource exposed as `ctx`.
 */
export type FormContextResource<TValue> = [TValue] extends [Promise<infer TResolved>]
  ? FormAsyncResource<TResolved>
  : [TValue] extends [{ queryKey: infer TQueryKey }]
    ? FormQueryResource<TValue, TQueryKey>
    : FormSyncResource<TValue>
