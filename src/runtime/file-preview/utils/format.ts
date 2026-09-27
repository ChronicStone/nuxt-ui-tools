import { isString } from '../../shared/utils/predicate'
import type { FilePreviewText } from '../types'

export function resolveFilePreviewText(text: FilePreviewText) {
  return isString(text) ? text : text()
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Media time as `m:ss`, or `h:mm:ss` past an hour. */
export function formatFilePreviewDuration(seconds: number) {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}

export function formatFilePreviewDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

/** Splits a name so the end stays visible when the start is truncated: `Contrat-cadre-…2026.pdf`. */
export function splitFilePreviewName(name: string) {
  const tail = Math.min(name.length, 10)
  return { head: name.slice(0, name.length - tail), tail: name.slice(name.length - tail) }
}

const escapes = new Map([
  ['"', '&quot;'],
  ['&', '&amp;'],
  ["'", '&#39;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
])

export function escapeFilePreviewHtml(text: string) {
  return text.replaceAll(/["&'<>]/gu, (char) => escapes.get(char) ?? char)
}

const JSON_TOKEN =
  /(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/gu

/** Escapes one line of formatted JSON and tints keys, strings, numbers, and literals. */
export function tintFilePreviewJsonLine(line: string) {
  return escapeFilePreviewHtml(line).replaceAll(
    JSON_TOKEN,
    (match, text: string | undefined, colon: string | undefined, literal: string | undefined) => {
      if (text) return `<span data-token="${colon ? 'key' : 'string'}">${text}</span>${colon ?? ''}`
      if (literal) return `<span data-token="literal">${literal}</span>`
      return `<span data-token="number">${match}</span>`
    },
  )
}
