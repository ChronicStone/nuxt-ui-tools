import { CalendarDate, Time, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

import { isNumber, isString } from '../../utils/predicate'

export type FormDateFamilyType =
  | 'date'
  | 'datetime'
  | 'daterange'
  | 'monthrange'
  | 'datetimerange'
  | 'month'
  | 'year'

export interface FormCalendarRangeValue {
  start: DateValue | undefined
  end: DateValue | undefined
}

export interface FormTimeRangeValue {
  start: Time | undefined
  end: Time | undefined
}

type DateFormatToken = 'yyyy' | 'MM' | 'dd' | 'HH' | 'mm'

type DateFormatPart =
  | { type: 'token'; value: DateFormatToken }
  | { type: 'literal'; value: string }

interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export function isDateFamilyRange(type: FormDateFamilyType) {
  return type === 'daterange' || type === 'monthrange' || type === 'datetimerange'
}

export function hasDateFamilyTime(type: FormDateFamilyType) {
  return type === 'datetime' || type === 'datetimerange'
}

export function dateFamilyCalendarType(type: FormDateFamilyType): 'date' | 'month' | 'year' {
  if (type === 'month' || type === 'monthrange') return 'month'
  if (type === 'year') return 'year'
  return 'date'
}

export function defaultDateManualFormat(type: FormDateFamilyType, locale: string) {
  if (type === 'year') return 'yyyy'
  if (type === 'month' || type === 'monthrange') return 'MM/yyyy'

  const dateFormat = locale.toLowerCase().startsWith('fr') ? 'dd/MM/yyyy' : 'MM/dd/yyyy'
  return hasDateFamilyTime(type) ? `${dateFormat} HH:mm` : dateFormat
}

export function dateManualPlaceholder(format: string, range: boolean) {
  const placeholder = format.toLowerCase()
  return range ? `${placeholder} – ${placeholder}` : placeholder
}

export function applyDateManualMask(value: string, format: string, range: boolean) {
  const digits = value.replace(/\D/g, '')
  const width = formatDigitWidth(format)
  if (!width) return value

  if (!range) return formatDigits(digits.slice(0, width), format)

  const startDigits = digits.slice(0, width)
  const endDigits = digits.slice(width, width * 2)
  const start = formatDigits(startDigits, format)
  if (!endDigits) return start
  return `${start} – ${formatDigits(endDigits, format)}`
}

export function parseDateManualValue(
  value: string,
  format: string,
  type: FormDateFamilyType,
): string | readonly [string, string] | undefined {
  const width = formatDigitWidth(format)
  if (!width) return undefined

  const digits = value.replace(/\D/g, '')
  if (isDateFamilyRange(type)) {
    if (digits.length !== width * 2) return undefined
    const start = parseDateManualPart(digits.slice(0, width), format, type)
    const end = parseDateManualPart(digits.slice(width), format, type)
    if (!start || !end || start > end) return undefined
    return [start, end]
  }

  if (digits.length !== width) return undefined
  return parseDateManualPart(digits, format, type)
}

export function formatDateManualValue(
  values: readonly [string, string],
  format: string,
  type: FormDateFamilyType,
) {
  if (!isDateFamilyRange(type)) return formatCanonicalPart(values[0], format, type)

  const start = formatCanonicalPart(values[0], format, type)
  const end = formatCanonicalPart(values[1], format, type)
  if (!start && !end) return ''
  if (!start || !end) return `${start} – ${end}`
  return `${start} – ${end}`
}

export function calendarValueFromCanonical(type: FormDateFamilyType, value: string) {
  if (!value) return undefined

  if (type === 'year') {
    const year = Number(value.slice(0, 4))
    return validYear(year) ? new CalendarDate(year, 1, 1) : undefined
  }

  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3] ?? 1)
  if (!isValidCalendarDate(year, month, day)) return undefined
  return new CalendarDate(year, month, day)
}

export function calendarRangeFromCanonical(
  type: FormDateFamilyType,
  values: readonly [string, string],
): FormCalendarRangeValue | null {
  const start = calendarValueFromCanonical(type, values[0])
  const end = calendarValueFromCanonical(type, values[1])
  if (!start && !end) return null
  return { start, end }
}

export function serializeCalendarValue(
  type: FormDateFamilyType,
  value: DateValue,
  existing: string,
) {
  if (type === 'year') return String(value.year).padStart(4, '0')
  if (type === 'month' || type === 'monthrange')
    return `${String(value.year).padStart(4, '0')}-${pad(value.month)}`

  const date = `${String(value.year).padStart(4, '0')}-${pad(value.month)}-${pad(value.day)}`
  if (!hasDateFamilyTime(type)) return date

  const time = timeValueFromCanonical(existing) ?? new Time(9, 0)
  return `${date}T${pad(time.hour)}:${pad(time.minute)}`
}

export function timeValueFromCanonical(value: string) {
  const match = /T(\d{2}):(\d{2})/.exec(value)
  if (!match) return undefined

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!isValidTime(hour, minute)) return undefined
  return new Time(hour, minute)
}

export function timeRangeFromCanonical(values: readonly [string, string]): FormTimeRangeValue {
  return {
    start: timeValueFromCanonical(values[0]),
    end: timeValueFromCanonical(values[1]),
  }
}

export function serializeTimeValue(existing: string, value: { hour: number; minute: number }) {
  const date = /^(\d{4}-\d{2}-\d{2})/.exec(existing)?.[1]
  if (!date) return existing
  return `${date}T${pad(value.hour)}:${pad(value.minute)}`
}

export type FormDateSeedValue = Date | string | number | null | undefined

export function canonicalDateFromValue(value: FormDateSeedValue) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return `${String(value.getFullYear()).padStart(4, '0')}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }
  return isString(value) ? value : ''
}

export function canonicalDateToJsDate(value: string) {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?/.exec(value)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3] ?? 1)
  const hour = Number(match[4] ?? 0)
  const minute = Number(match[5] ?? 0)
  if (!isValidCalendarDate(year, month, day) || !isValidTime(hour, minute)) return undefined
  return new Date(year, month - 1, day, hour, minute)
}

export function calendarSeedFromValue(value: FormDateSeedValue, type: FormDateFamilyType) {
  if (value instanceof Date) return canonicalDateFromValue(value)
  if (isString(value)) return value
  if (isNumber(value) && type === 'year') return String(value)
  return ''
}

export function calendarDateToJsDate(value: DateValue) {
  return value.toDate(getLocalTimeZone())
}

function parseDateManualPart(
  digits: string,
  format: string,
  type: FormDateFamilyType,
): string | undefined {
  const tokens = tokenizeDateFormat(format).filter(
    (part): part is { type: 'token'; value: DateFormatToken } => part.type === 'token',
  )
  if (!tokens.length) return undefined

  const values = new Map<DateFormatToken, number>()
  let offset = 0
  for (const token of tokens) {
    const width = tokenWidth(token.value)
    const raw = digits.slice(offset, offset + width)
    if (raw.length !== width) return undefined
    values.set(token.value, Number(raw))
    offset += width
  }
  if (offset !== digits.length) return undefined

  const parts: DateParts = {
    year: values.get('yyyy') ?? 0,
    month: values.get('MM') ?? 1,
    day: values.get('dd') ?? 1,
    hour: values.get('HH') ?? 0,
    minute: values.get('mm') ?? 0,
  }
  if (!validYear(parts.year)) return undefined
  if (type !== 'year' && (parts.month < 1 || parts.month > 12)) return undefined
  if (
    type !== 'year' &&
    type !== 'month' &&
    type !== 'monthrange' &&
    !isValidCalendarDate(parts.year, parts.month, parts.day)
  )
    return undefined
  if (hasDateFamilyTime(type) && !isValidTime(parts.hour, parts.minute)) return undefined

  if (type === 'year') return String(parts.year).padStart(4, '0')
  if (type === 'month' || type === 'monthrange')
    return `${String(parts.year).padStart(4, '0')}-${pad(parts.month)}`

  const date = `${String(parts.year).padStart(4, '0')}-${pad(parts.month)}-${pad(parts.day)}`
  if (!hasDateFamilyTime(type)) return date
  return `${date}T${pad(parts.hour)}:${pad(parts.minute)}`
}

function formatCanonicalPart(value: string, format: string, type: FormDateFamilyType) {
  if (!value) return ''
  const parts = canonicalParts(value, type)
  if (!parts) return value

  return tokenizeDateFormat(format)
    .map((part) => {
      if (part.type === 'literal') return part.value
      if (part.value === 'yyyy') return String(parts.year).padStart(4, '0')
      if (part.value === 'MM') return pad(parts.month)
      if (part.value === 'dd') return pad(parts.day)
      if (part.value === 'HH') return pad(parts.hour)
      return pad(parts.minute)
    })
    .join('')
}

function canonicalParts(value: string, type: FormDateFamilyType): DateParts | undefined {
  if (type === 'year') {
    const year = Number(value.slice(0, 4))
    if (!validYear(year)) return undefined
    return { year, month: 1, day: 1, hour: 0, minute: 0 }
  }

  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?/.exec(value)
  if (!match) return undefined
  const parts: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3] ?? 1),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
  }
  if (!isValidCalendarDate(parts.year, parts.month, parts.day)) return undefined
  if (!isValidTime(parts.hour, parts.minute)) return undefined
  return parts
}

function formatDigits(digits: string, format: string) {
  const parts = tokenizeDateFormat(format)
  let offset = 0
  let result = ''

  for (const [index, part] of parts.entries()) {
    if (part.type === 'literal') {
      const previous = parts[index - 1]
      if (previous?.type === 'token' && offset >= tokenWidth(previous.value)) result += part.value
      continue
    }

    const width = tokenWidth(part.value)
    const value = digits.slice(offset, offset + width)
    if (!value) break
    result += value
    offset += value.length
    if (value.length < width) break
  }

  return result
}

function formatDigitWidth(format: string) {
  return tokenizeDateFormat(format).reduce(
    (total, part) => total + (part.type === 'token' ? tokenWidth(part.value) : 0),
    0,
  )
}

function tokenizeDateFormat(format: string): DateFormatPart[] {
  const parts: DateFormatPart[] = []
  const pattern = /yyyy|MM|dd|HH|mm/g
  let offset = 0
  let match = pattern.exec(format)

  while (match) {
    if (match.index > offset)
      parts.push({ type: 'literal', value: format.slice(offset, match.index) })
    const token = match[0]
    if (isDateFormatToken(token)) parts.push({ type: 'token', value: token })
    offset = match.index + token.length
    match = pattern.exec(format)
  }

  if (offset < format.length) parts.push({ type: 'literal', value: format.slice(offset) })
  return parts
}

function isDateFormatToken(value: string): value is DateFormatToken {
  return value === 'yyyy' || value === 'MM' || value === 'dd' || value === 'HH' || value === 'mm'
}

function tokenWidth(token: DateFormatToken) {
  return token === 'yyyy' ? 4 : 2
}

function isValidCalendarDate(year: number, month: number, day: number) {
  if (!validYear(year) || month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function validYear(year: number) {
  return Number.isInteger(year) && year > 0 && year <= 9999
}

function isValidTime(hour: number, minute: number) {
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}
