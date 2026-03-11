/**
 * Type predicate to filter out null and undefined values from arrays.
 * @example
 * const arr = [1, null, 2, undefined, 3]
 * const filtered = arr.filter(isDefined) // typed as number[]
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

/**
 * Type predicate to check if a value is null.
 */
export function isNull(value: unknown): value is null {
  return value === null
}

/**
 * Type predicate to check if a value is undefined.
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

/**
 * Type predicate to check if a value is null or undefined.
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Type predicate to check if a value is a string.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type predicate to check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type predicate to check if a value is a number (excluding NaN).
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Type predicate to check if a value is a finite number.
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Type predicate to check if a value is an integer.
 */
export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

/**
 * Type predicate to check if a value is a positive number.
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0
}

/**
 * Type predicate to check if a value is a non-negative number (>= 0).
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0
}

/**
 * Type predicate to check if a value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Type predicate to check if a value is a function.
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

/**
 * Type predicate to check if a value is a symbol.
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol'
}

/**
 * Type predicate to check if a value is a bigint.
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint'
}

/**
 * Type predicate to check if a value is a Date object.
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * Type predicate to check if a value is a valid Date object.
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * Type predicate to check if a value is a RegExp.
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp
}

/**
 * Type predicate to check if a value is a Promise.
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (value !== null &&
      typeof value === 'object' &&
      'then' in value &&
      typeof (value as any).then === 'function')
  )
}

/**
 * Type predicate to check if a value is an Error.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Type predicate to check if a value is a plain object (not null, not array, not class instance).
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

/**
 * Type predicate to check if a value is a non-empty array.
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]]
export function isNonEmptyArray(value: unknown): value is [unknown, ...unknown[]]
export function isNonEmptyArray(value: unknown): value is [unknown, ...unknown[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Type predicate to check if a value is an array of a specific type.
 */
export function isArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate)
}

/**
 * Type predicate to check if a value is a non-empty plain object.
 */
export function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && Object.keys(value).length > 0
}

/**
 * Type predicate to check if a value is a primitive (string, number, boolean, null, undefined, symbol, bigint).
 */
export function isPrimitive(
  value: unknown,
): value is string | number | boolean | null | undefined | symbol | bigint {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint'
  )
}

/**
 * Type predicate to check if a value has a specific property.
 */
export function hasProperty<K extends PropertyKey>(
  value: unknown,
  key: K,
): value is Record<K, unknown> {
  return value !== null && typeof value === 'object' && key in value
}

/**
 * Type predicate to check if a value has specific properties.
 */
export function hasProperties<K extends PropertyKey>(
  value: unknown,
  keys: K[],
): value is Record<K, unknown> {
  return value !== null && typeof value === 'object' && keys.every((key) => key in value)
}

/**
 * Type predicate to check if a value has a property with a specific type.
 */
export function hasTypedProperty<K extends PropertyKey, T>(
  value: unknown,
  key: K,
  predicate: (prop: unknown) => prop is T,
): value is Record<K, T> {
  return hasProperty(value, key) && predicate(value[key])
}

/**
 * Creates a type predicate that checks if a value equals one of the given values.
 * @example
 * const isStatus = isOneOf(['pending', 'active', 'completed'] as const)
 * if (isStatus(value)) { // value is 'pending' | 'active' | 'completed' }
 */
export function isOneOf<const T extends readonly unknown[]>(
  values: T,
): (value: unknown) => value is T[number] {
  return (value: unknown): value is T[number] => values.includes(value)
}

/**
 * Creates a negated type predicate.
 * @example
 * const isNotNull = not(isNull)
 * const values = [1, null, 2].filter(isNotNull) // typed as (number | null)[] -> filters nulls
 */
export function not<T, S extends T>(
  predicate: (value: T) => value is S,
): (value: T) => value is Exclude<T, S> {
  return (value: T): value is Exclude<T, S> => !predicate(value)
}

/**
 * Creates a type predicate that checks if a value matches all predicates.
 */
export function all<T, S extends T>(
  ...predicates: Array<(value: T) => value is S>
): (value: T) => value is S {
  return (value: T): value is S => predicates.every((p) => p(value))
}

/**
 * Creates a type predicate that checks if a value matches any of the predicates.
 */
export function some<T, S extends T>(
  ...predicates: Array<(value: T) => value is S>
): (value: T) => value is S {
  return (value: T): value is S => predicates.some((p) => p(value))
}

/**
 * Type predicate to check if a value is truthy.
 * Filters out: false, 0, '', null, undefined, NaN
 */
export function isTruthy<T>(value: T): value is Exclude<T, false | 0 | '' | null | undefined> {
  return Boolean(value)
}

/**
 * Type predicate to check if a value is falsy.
 */
export function isFalsy(value: unknown): value is false | 0 | '' | null | undefined {
  return !value
}

/**
 * Type predicate to check if a string matches a pattern.
 */
export function matchesPattern(pattern: RegExp): (value: unknown) => value is string {
  return (value: unknown): value is string => isString(value) && pattern.test(value)
}

/**
 * Type predicate to check if a value is a valid email string.
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false
  const atIndex = value.indexOf('@')
  if (atIndex < 1) return false
  const domain = value.slice(atIndex + 1)
  const dotIndex = domain.lastIndexOf('.')
  return dotIndex > 0 && dotIndex < domain.length - 1 && !value.includes(' ')
}

/**
 * Type predicate to check if a value is a valid URL string.
 */
export function isURL(value: unknown): value is string {
  if (!isString(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Type predicate to check if a value is a valid UUID string.
 */
export const isUUID = matchesPattern(
  /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
)

/**
 * Type predicate to check if a value is an instance of a class.
 */
export function isInstanceOf<T>(
  constructor: new (...args: any[]) => T,
): (value: unknown) => value is T {
  return (value: unknown): value is T => value instanceof constructor
}

/**
 * Type predicate to check if a value is a Map.
 */
export function isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V> {
  return value instanceof Map
}

/**
 * Type predicate to check if a value is a Set.
 */
export function isSet<T = unknown>(value: unknown): value is Set<T> {
  return value instanceof Set
}

/**
 * Type predicate to check if a value is a WeakMap.
 */
export function isWeakMap<K extends WeakKey = WeakKey, V = unknown>(
  value: unknown,
): value is WeakMap<K, V> {
  return value instanceof WeakMap
}

/**
 * Type predicate to check if a value is a WeakSet.
 */
export function isWeakSet<T extends WeakKey = WeakKey>(value: unknown): value is WeakSet<T> {
  return value instanceof WeakSet
}

/**
 * Type predicate to check if a value is iterable.
 */
export function isIterable<T = unknown>(value: unknown): value is Iterable<T> {
  return (
    value !== null && value !== undefined && typeof (value as any)[Symbol.iterator] === 'function'
  )
}

/**
 * Type predicate to check if a value is an ArrayBuffer.
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer
}

/**
 * Type predicate to check if a value is a TypedArray.
 */
export function isTypedArray(
  value: unknown,
): value is
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array {
  return ArrayBuffer.isView(value) && !(value instanceof DataView)
}

/**
 * Asserts that a value satisfies a type predicate, throwing if it doesn't.
 * @throws {Error} If the value doesn't satisfy the predicate
 */
export function assertType<T>(
  value: unknown,
  predicate: (value: unknown) => value is T,
  message = 'Type assertion failed',
): asserts value is T {
  if (!predicate(value)) {
    throw new Error(message)
  }
}

/**
 * Asserts that a value is defined (not null or undefined).
 * @throws {Error} If the value is null or undefined
 */
export function assertDefined<T>(
  value: T,
  message = 'Expected value to be defined',
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
}
