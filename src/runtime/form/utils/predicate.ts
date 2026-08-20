import {
  isArray as isSharedArray,
  isFunction as isSharedFunction,
  isString as isSharedString,
} from '../../shared/utils/predicate'
import type { FormValue } from '../types/utils'

type CallableValue<T> = T extends (...args: infer TArgs) => infer TResult
  ? (...args: TArgs) => TResult
  : (...args: FormValue[]) => FormValue

export {
  hasProperty,
  hasTypedProperty,
  isArray,
  isBoolean,
  isDefined,
  isNull,
  isNumber,
  isObject,
  isPlainObject,
  isPromise,
  isString,
  isSymbol,
  isUndefined,
} from '../../shared/utils/predicate'

/** Recognizes normal and async callbacks at form runtime boundaries. */
export function isFunction<T>(value: T): value is T & CallableValue<T> {
  return isSharedFunction(value) || value instanceof Function
}

/** Invokes a parsed form callback and keeps its untrusted result at the form boundary. */
export function invokeFormFunction(value: FormValue, args: FormValue[] = []): FormValue {
  if (!isFunction(value)) return undefined
  return value(...args)
}

/** Parses a runtime value into the form's supported string-path list contract. */
export function stringArray(value: FormValue): readonly string[] {
  if (!isSharedArray<FormValue, FormValue>(value)) return []
  return value.filter(isSharedString)
}
