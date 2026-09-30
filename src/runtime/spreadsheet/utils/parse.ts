import { SSF } from 'xlsx'

import { normalizeSpreadsheetText } from './text'

const MONTHS: readonly (readonly string[])[] = [
  ['january', 'jan', 'janvier', 'janv'],
  ['february', 'feb', 'fevrier', 'fevr', 'fev'],
  ['march', 'mar', 'mars'],
  ['april', 'apr', 'avril', 'avr'],
  ['may', 'mai'],
  ['june', 'jun', 'juin'],
  ['july', 'jul', 'juillet', 'juil'],
  ['august', 'aug', 'aout'],
  ['september', 'sep', 'sept', 'septembre'],
  ['october', 'oct', 'octobre'],
  ['november', 'nov', 'novembre'],
  ['december', 'dec', 'decembre'],
]
const DEFAULT_DATE_FORMATS = [
  'yyyy-MM-dd',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd HH:mm:ss',
  'dd/MM/yyyy',
  'dd/MM/yyyy HH:mm',
]
const TOKENS = /yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|hh|h|mm|ss|a/gu

interface DateParts {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
  hasTime: boolean
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

function toIso(parts: DateParts) {
  const date = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`
  if (!parts.hasTime) return date
  const time = `${pad(parts.hours)}:${pad(parts.minutes)}`
  return parts.seconds ? `${date}T${time}:${pad(parts.seconds)}` : `${date}T${time}`
}

function isValidDate(parts: DateParts) {
  const date = new Date(parts.year, parts.month - 1, parts.day)
  return (
    date.getFullYear() === parts.year &&
    date.getMonth() === parts.month - 1 &&
    date.getDate() === parts.day &&
    parts.hours < 24 &&
    parts.minutes < 60 &&
    parts.seconds < 60
  )
}

function monthFromName(name: string) {
  const normalized = normalizeSpreadsheetText(name).replace(/\.$/u, '')
  const index = MONTHS.findIndex((names) => names.includes(normalized))
  return index < 0 ? 0 : index + 1
}

const formatCache = new Map<string, { pattern: RegExp; tokens: string[] }>()

function compileFormat(format: string) {
  const cached = formatCache.get(format)
  if (cached) return cached
  const tokens: string[] = []
  let source = ''
  let last = 0
  for (const match of format.matchAll(TOKENS)) {
    source += format
      .slice(last, match.index)
      .replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')
      .replaceAll(/\s+/gu, '\\s+')
    tokens.push(match[0])
    source +=
      match[0] === 'MMMM' || match[0] === 'MMM'
        ? '([\\p{L}]+\\.?)'
        : match[0] === 'a'
          ? '([AaPp]\\.?[Mm]\\.?)'
          : match[0] === 'yyyy'
            ? '(\\d{4})'
            : '(\\d{1,2})'
    last = (match.index ?? 0) + match[0].length
  }
  source += format
    .slice(last)
    .replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')
    .replaceAll(/\s+/gu, '\\s+')
  const compiled = { pattern: new RegExp(`^${source}$`, 'u'), tokens }
  formatCache.set(format, compiled)
  return compiled
}

function parseWithFormat(text: string, format: string): DateParts | null {
  const { pattern, tokens } = compileFormat(format)
  const match = pattern.exec(text.trim())
  if (!match) return null
  const parts: DateParts = {
    day: 1,
    hasTime: false,
    hours: 0,
    minutes: 0,
    month: 1,
    seconds: 0,
    year: 1970,
  }
  let pm: boolean | null = null
  for (const [index, token] of tokens.entries()) {
    const value = match[index + 1] ?? ''
    const number = Number(value)
    if (token === 'yyyy') parts.year = number
    else if (token === 'yy') parts.year = 2000 + number
    else if (token === 'MMMM' || token === 'MMM') parts.month = monthFromName(value)
    else if (token === 'MM' || token === 'M') parts.month = number
    else if (token === 'dd' || token === 'd') parts.day = number
    else if (token === 'HH' || token === 'H' || token === 'hh' || token === 'h') {
      parts.hours = number
      parts.hasTime = true
    } else if (token === 'mm') {
      parts.minutes = number
      parts.hasTime = true
    } else if (token === 'ss') parts.seconds = number
    else if (token === 'a') pm = value.toLowerCase().startsWith('p')
  }
  if (pm !== null) {
    if (parts.hours > 12 || parts.hours === 0) return null
    parts.hours = (parts.hours % 12) + (pm ? 12 : 0)
  }
  return parts.month && isValidDate(parts) ? parts : null
}

function partsFromDate(date: Date): DateParts {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  return {
    day: date.getDate(),
    hasTime: Boolean(hours || minutes || seconds),
    hours,
    minutes,
    month: date.getMonth() + 1,
    seconds,
    year: date.getFullYear(),
  }
}

/** Reads a date: an Excel date, an Excel serial number, or text in one of `formats`. Returns ISO or `null`. */
export function parseSpreadsheetDate(text: string, raw: unknown, formats: readonly string[]) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return toIso(partsFromDate(raw))
  if (typeof raw === 'number') {
    const code = SSF.parse_date_code(raw)
    if (code && code.y > 1900) {
      const parts: DateParts = {
        day: code.d,
        hasTime: Boolean(code.H || code.M || code.S),
        hours: code.H,
        minutes: code.M,
        month: code.m,
        seconds: Math.round(code.S),
        year: code.y,
      }
      return toIso(parts)
    }
  }
  for (const format of formats.length ? formats : DEFAULT_DATE_FORMATS) {
    const parts = parseWithFormat(text, format)
    if (parts) return toIso(parts)
  }
  return null
}

/** Reads a number, with `,` or `.` as decimal separator; spaces and the other separator are ignored. */
export function parseSpreadsheetNumber(text: string, raw: unknown, decimal: '.' | ',') {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const compact = text.replaceAll(/[\s  ']/gu, '')
  const normalized =
    decimal === ',' ? compact.replaceAll('.', '').replace(',', '.') : compact.replaceAll(',', '')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/u.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

/** Reads a boolean from the texts accepted as true and false. Returns `null` for anything else. */
export function parseSpreadsheetBoolean(
  text: string,
  raw: unknown,
  trueTexts: readonly string[],
  falseTexts: readonly string[],
) {
  if (typeof raw === 'boolean') return raw
  const normalized = normalizeSpreadsheetText(text)
  if (trueTexts.some((value) => normalizeSpreadsheetText(value) === normalized)) return true
  if (falseTexts.some((value) => normalizeSpreadsheetText(value) === normalized)) return false
  return null
}
