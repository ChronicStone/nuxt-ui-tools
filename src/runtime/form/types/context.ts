import type { DataTag, QueryKey } from '@tanstack/vue-query'
import type { GenericObject } from '../../shared/types/utils'
import type { FormContextResource } from './utils'

/**
 * Query options accepted by form context and option sources.
 */
export interface FormQueryOptions<_TValue = unknown> {
  queryKey: QueryKey
}

/**
 * A single context source declared on a form schema.
 *
 * Sources do not receive other context values. This keeps the context graph easy to infer and
 * matches the intended form-scoped data model.
 */
export type FormContextSource<TValue = unknown> =
  | TValue
  | Promise<TValue>
  | FormQueryOptions<TValue>
  | (() => TValue | Promise<TValue> | FormQueryOptions<TValue>)

/**
 * Object of named context sources declared by a form schema.
 */
export type FormContextDefinition = GenericObject

type ResolveContextSource<TSource> = TSource extends () => infer TResult
  ? FormContextResource<TResult>
  : FormContextResource<TSource>

/**
 * Fully typed context object exposed to field callbacks as `ctx`.
 */
export type FormContextData<TContext extends FormContextDefinition | undefined = FormContextDefinition> = TContext extends FormContextDefinition
  ? { [TKey in keyof TContext]: ResolveContextSource<TContext[TKey]> }
  : {}

export type FormRuntimeContext = FormContextData

export type { DataTag, QueryKey }
