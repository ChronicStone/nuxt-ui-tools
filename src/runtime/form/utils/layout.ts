import type { FormLayoutConfig } from '../types'
import { isNumber } from './predicate'

export const FORM_LAYOUT_DEFAULTS = {
  columns: 8,
  fieldSpan: '8 md:4',
  gap: 16,
} as const

export function resolveFormLayoutConfig(
  base: FormLayoutConfig | undefined,
  override?: FormLayoutConfig,
): FormLayoutConfig {
  return {
    columns: override?.columns ?? base?.columns ?? FORM_LAYOUT_DEFAULTS.columns,
    fieldSpan: override?.fieldSpan ?? base?.fieldSpan ?? FORM_LAYOUT_DEFAULTS.fieldSpan,
    gap: override?.gap ?? base?.gap ?? FORM_LAYOUT_DEFAULTS.gap,
  }
}

export function normalizeFormLayoutGap(value: number | string | undefined) {
  const gap = value ?? FORM_LAYOUT_DEFAULTS.gap
  if (isNumber(gap)) return `${gap}px`
  return gap
}

export function normalizeFormGridColumnsStyle(value: string) {
  const columns = normalizePositiveInteger(value, FORM_LAYOUT_DEFAULTS.columns)
  return `grid-template-columns: repeat(${columns}, minmax(0, 1fr))`
}

export function normalizeFormGridColumnSpanStyle(value: string) {
  if (value === 'full') return 'grid-column: 1 / -1'

  const span = normalizePositiveInteger(value, 1)
  return `grid-column: span ${span} / span ${span}`
}

function normalizePositiveInteger(value: string, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(1, Math.trunc(parsed))
}
