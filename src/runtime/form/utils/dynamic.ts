import { isFunction } from '../../shared/utils/predicate'
import type { FormDynamic } from '../types'

/**
 * Value of a static-or-callback option: the callback's result for `params`, else the value.
 * Any function counts as the callback, the same convention as every field callback.
 */
export function resolveFormDynamic<TValue, TParams>(
  value: FormDynamic<TValue, TParams>,
  params: TParams,
): TValue {
  return isDynamicCallback(value) ? value(params) : value
}

function isDynamicCallback<TValue, TParams>(
  value: FormDynamic<TValue, TParams>,
): value is (params: TParams) => TValue {
  return isFunction(value)
}
