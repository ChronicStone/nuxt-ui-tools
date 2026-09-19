import type { FormValue } from '../types'
import { isRecord } from './path'

function isPlainRecord(value: FormValue): value is Record<string, FormValue> {
  if (!isRecord(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function isEqualFormValue(left: FormValue, right: FormValue): boolean {
  if (Object.is(left, right)) {
    return true
  }
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime()
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => isEqualFormValue(item, right[index]))
    )
  }
  if (isPlainRecord(left) && isPlainRecord(right)) {
    const keys = Object.keys(left)
    if (keys.length !== Object.keys(right).length) {
      return false
    }
    return keys.every((key) => key in right && isEqualFormValue(left[key], right[key]))
  }
  return false
}
