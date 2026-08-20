import type { GenericObject } from '../types/utils'

/** A record whose values are decoded by the owning boundary. */
export type Dictionary = object

type FunctionValue = (...args: never[]) => GenericObject[string]

type FunctionLike<T> = T extends (...args: infer TArgs) => infer TResult
  ? (...args: TArgs) => TResult
  : FunctionValue

function objectTag<T>(value: T): string {
  return Object.prototype.toString.call(value)
}

/** Type predicate to filter out null and undefined values from arrays. */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

/** Type predicate to check if a value is null. */
export function isNull<T>(value: T): value is T & null {
  return value === null
}

/** Type predicate to check if a value is undefined. */
export function isUndefined<T>(value: T): value is T & undefined {
  return value === undefined
}

/** Type predicate to check if a value is null or undefined. */
export function isNullish<T>(value: T): value is T & (null | undefined) {
  return value === null || value === undefined
}

/** Type predicate to check if a value is a string. */
export function isString<T>(value: T): value is T & string {
  return objectTag(value) === '[object String]'
}

/** Type predicate to check if a value is a non-empty string. */
export function isNonEmptyString<T>(value: T): value is T & string {
  return isString(value) && value.length > 0
}

/** Type predicate to check if a value is a number (excluding NaN). */
export function isNumber<T>(value: T): value is T & number {
  return objectTag(value) === '[object Number]' && !Number.isNaN(value)
}

/** Type predicate to check if a value is a finite number. */
export function isFiniteNumber<T>(value: T): value is T & number {
  return isNumber(value) && Number.isFinite(value)
}

/** Type predicate to check if a value is an integer. */
export function isInteger<T>(value: T): value is T & number {
  return isNumber(value) && Number.isInteger(value)
}

/** Type predicate to check if a value is a positive number. */
export function isPositiveNumber<T>(value: T): value is T & number {
  return isNumber(value) && value > 0
}

/** Type predicate to check if a value is a non-negative number. */
export function isNonNegativeNumber<T>(value: T): value is T & number {
  return isNumber(value) && value >= 0
}

/** Type predicate to check if a value is a boolean. */
export function isBoolean<T>(value: T): value is T & boolean {
  return objectTag(value) === '[object Boolean]'
}

/** Type predicate to check if a value is callable, including async and generator functions. */
export function isFunction<T>(value: T): value is T & FunctionLike<T> {
  const tag = objectTag(value)
  return (
    tag === '[object Function]' ||
    tag === '[object AsyncFunction]' ||
    tag === '[object GeneratorFunction]' ||
    tag === '[object AsyncGeneratorFunction]'
  )
}

/** Type predicate to check if a value is an object (excluding null and arrays). */
export function isObject<T>(value: T): value is T & GenericObject {
  return objectTag(value) === '[object Object]' && !Array.isArray(value)
}

/** Type predicate to check if a value is a symbol. */
export function isSymbol<T>(value: T): value is T & symbol {
  return objectTag(value) === '[object Symbol]'
}

/** Type predicate to check if a value is a bigint. */
export function isBigInt<T>(value: T): value is T & bigint {
  return objectTag(value) === '[object BigInt]'
}

/** Type predicate to check if a value is a Date object with a valid timestamp. */
export function isDate<T>(value: T): value is T & Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/** Type predicate to check if a value is a valid Date object. */
export function isValidDate<T>(value: T): value is T & Date {
  return isDate(value)
}

/** Type predicate to check if a value is a RegExp. */
export function isRegExp<T>(value: T): value is T & RegExp {
  return value instanceof RegExp
}

/** Type predicate to check if a value is a Promise. */
export function isPromise<T>(value: T): value is T & Promise<unknown> {
  if (value instanceof Promise) return true
  if (!isObject(value) || !('then' in value)) return false
  return isFunction(value.then)
}

/** Type predicate to check if a value is an Error. */
export function isError<T>(value: T): value is T & Error {
  return value instanceof Error
}

/** Type predicate to check if a value is a plain object. */
export function isPlainObject<T>(value: T): value is T & GenericObject {
  if (!isObject(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

/** Type predicate to check if a value is an array. */
export function isArray<T, TItem = never>(value: T): value is T & TItem[] {
  return Array.isArray(value)
}

/** Type predicate to check if a value is a non-empty array. */
export function isNonEmptyArray<T, TItem = never>(value: T): value is T & [TItem, ...TItem[]] {
  return Array.isArray(value) && value.length > 0
}

/** Type predicate to check if a value is an array whose items match a predicate. */
export function isArrayOf<T, TItem extends T>(
  value: T,
  predicate: (item: T & TItem) => item is TItem,
): value is T & TItem[] {
  return Array.isArray(value) && value.every((item) => predicate(item))
}

/** Type predicate to check if a value is a non-empty plain object. */
export function isNonEmptyObject<T>(value: T): value is T & GenericObject {
  return isPlainObject(value) && Object.keys(value).length > 0
}

/** Type predicate to check if a value is a primitive. */
export function isPrimitive<T>(
  value: T,
): value is T & (string | number | boolean | null | undefined | symbol | bigint) {
  return (
    value === null ||
    value === undefined ||
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isSymbol(value) ||
    isBigInt(value)
  )
}

/** Type predicate to check if a value has a specific property. */
export function hasProperty<T, K extends PropertyKey>(
  value: T,
  key: K,
): value is T & GenericObject {
  return (isObject(value) || Array.isArray(value)) && key in value
}

/** Type predicate to check if a value has specific properties. */
export function hasProperties<T, K extends PropertyKey>(
  value: T,
  keys: K[],
): value is T & GenericObject {
  return keys.every((key) => hasProperty(value, key))
}

/** Type predicate to check if a value has a property with a specific type. */
export function hasTypedProperty<T, K extends string, TValue>(
  value: T,
  key: K,
  predicate: (property: GenericObject[string]) => property is GenericObject[string] & TValue,
): boolean {
  if (!isObject(value) || !(key in value)) return false
  return predicate(value[key])
}

/** Creates a type predicate that checks if a value equals one of the given values. */
export function isOneOf<const T extends readonly PropertyKey[]>(
  values: T,
): <TValue>(value: TValue) => value is TValue & T[number] {
  return <TValue>(value: TValue): value is TValue & T[number] =>
    values.some((candidate) => Object.is(candidate, value))
}

/** Creates a negated type predicate. */
export function not<T, S extends T>(
  predicate: (value: T) => value is S,
): (value: T) => value is Exclude<T, S> {
  return (value: T): value is Exclude<T, S> => !predicate(value)
}

/** Creates a type predicate that checks if a value matches all predicates. */
export function all<T, S extends T>(
  ...predicates: Array<(value: T) => value is S>
): (value: T) => value is S {
  return (value: T): value is S => predicates.every((predicate) => predicate(value))
}

/** Creates a type predicate that checks if a value matches any predicate. */
export function some<T, S extends T>(
  ...predicates: Array<(value: T) => value is S>
): (value: T) => value is S {
  return (value: T): value is S => predicates.some((predicate) => predicate(value))
}

/** Type predicate to check if a value is truthy. */
export function isTruthy<T>(value: T): value is Exclude<T, false | 0 | '' | null | undefined> {
  return Boolean(value)
}

/** Type predicate to check if a value is falsy. */
export function isFalsy<T>(value: T): value is T & (false | 0 | '' | null | undefined) {
  return !value
}

/** Type predicate to check if a string matches a pattern. */
export function matchesPattern(pattern: RegExp): <T>(value: T) => value is T & string {
  return <T>(value: T): value is T & string => isString(value) && pattern.test(value)
}

/** Type predicate to check if a value is a valid email string. */
export function isEmail<T>(value: T): value is T & string {
  if (!isString(value)) return false
  const atIndex = value.indexOf('@')
  if (atIndex < 1) return false
  const domain = value.slice(atIndex + 1)
  const dotIndex = domain.lastIndexOf('.')
  return dotIndex > 0 && dotIndex < domain.length - 1 && !value.includes(' ')
}

/** Type predicate to check if a value is a valid URL string. */
export function isURL<T>(value: T): value is T & string {
  if (!isString(value)) return false
  try {
    const url = new URL(value)
    return url.protocol.length > 0
  } catch {
    return false
  }
}

/** Type predicate to check if a value is a valid UUID string. */
export const isUUID = matchesPattern(
  /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/iu,
)

/** Creates a predicate that checks if a value is an instance of a class. */
export function isInstanceOf<T, C extends abstract new (...args: never[]) => T>(
  constructor: C,
): <TValue>(value: TValue) => value is TValue & T {
  return <TValue>(value: TValue): value is TValue & T => value instanceof constructor
}

/** Type predicate to check if a value is a Map. */
export function isMap<T, K = never, V = never>(value: T): value is T & Map<K, V> {
  return value instanceof Map
}

/** Type predicate to check if a value is a Set. */
export function isSet<T, TValue = never>(value: T): value is T & Set<TValue> {
  return value instanceof Set
}

/** Type predicate to check if a value is a WeakMap. */
export function isWeakMap<T, K extends WeakKey = WeakKey, V = never>(
  value: T,
): value is T & WeakMap<K, V> {
  return value instanceof WeakMap
}

/** Type predicate to check if a value is a WeakSet. */
export function isWeakSet<T, TValue extends WeakKey = WeakKey>(
  value: T,
): value is T & WeakSet<TValue> {
  return value instanceof WeakSet
}

/** Type predicate to check if a value is iterable. */
export function isIterable<T>(value: T): value is T & Iterable<unknown> {
  if (!(isObject(value) || Array.isArray(value))) return false
  const descriptor = Object.getOwnPropertyDescriptor(value, Symbol.iterator)
  return descriptor !== undefined && isFunction(descriptor.value)
}

/** Type predicate to check if a value is an ArrayBuffer. */
export function isArrayBuffer<T>(value: T): value is T & ArrayBuffer {
  return value instanceof ArrayBuffer
}

/** Type predicate to check if a value is a TypedArray. */
export function isTypedArray<T>(value: T): value is T & ArrayBufferView {
  return ArrayBuffer.isView(value) && !(value instanceof DataView)
}

/** Asserts that a value satisfies a type predicate. */
export function assertType<TValue, T>(
  value: TValue,
  predicate: (value: TValue) => value is TValue & T,
  message = 'Type assertion failed',
): asserts value is TValue & T {
  if (!predicate(value)) throw new Error(message)
}

/** Asserts that a value is defined (not null or undefined). */
export function assertDefined<T>(
  value: T,
  message = 'Expected value to be defined',
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) throw new Error(message)
}
