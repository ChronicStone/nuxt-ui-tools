import type { PropType } from 'vue'

import { isRecord } from '#ui-tools/shared/utils/path'
import { isBoolean, isNumber, isString } from '#ui-tools/shared/utils/predicate'

export type StubScalar = string | number | boolean | null | undefined
export type StubFunction = (...args: never[]) => StubValue | void
export type StubValue = StubScalar | File | Date | StubFunction | readonly StubValue[] | StubRecord
export interface StubRecord {
  [key: string]: StubValue
}

// SAFETY: stubs accept every authored prop shape; the constructor list keeps Vue's runtime check permissive.
export const optional = {
  default: undefined,
  type: [String, Number, Boolean, Array, Object, Function, Date] as PropType<StubValue>,
}

export function asRecord(value: StubValue): StubRecord | undefined {
  // SAFETY: isRecord narrows to a plain object and StubRecord members are StubValue by construction.
  return isRecord(value) ? (value as StubRecord) : undefined
}

export function asRecords(value: StubValue): StubRecord[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((entry) => {
    const record = asRecord(entry)
    return record ? [record] : []
  })
}

export function asStrings(value: StubValue): string[] {
  return Array.isArray(value) ? value.filter(isString) : []
}

export function asScalar(value: StubValue): StubScalar {
  return isString(value) || isNumber(value) || isBoolean(value) || value === null
    ? value
    : undefined
}

export function scalarText(value: StubValue, fallback = '') {
  const scalar = asScalar(value)
  return scalar === undefined || scalar === null ? fallback : String(scalar)
}

export function dataValue(value: StubValue) {
  const scalar = asScalar(value)
  return scalar === undefined || scalar === null || scalar === false ? undefined : String(scalar)
}

export function inputElement(event: Event) {
  return event.target instanceof HTMLInputElement ? event.target : null
}

export function textareaElement(event: Event) {
  return event.target instanceof HTMLTextAreaElement ? event.target : null
}
