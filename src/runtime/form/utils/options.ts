import type { FormFieldCallbackParams, FormOptionItem, FormOptionValue } from '../types'
import { isRecord } from './path'

export interface ResolvedFormOption {
  value: FormOptionValue
  label: string
  description?: string
  disabled?: boolean
}

export function normalizeOptionItem(option: unknown): ResolvedFormOption {
  if (isRecord(option)) {
    const rawValue = option.value
    return {
      value: normalizeOptionValue(rawValue),
      label:
        typeof option.label === 'string' || typeof option.label === 'number'
          ? String(option.label)
          : String(normalizeOptionValue(rawValue)),
      description:
        typeof option.description === 'string' || typeof option.description === 'number'
          ? String(option.description)
          : undefined,
      disabled: option.disabled === true,
    }
  }

  return {
    value: normalizeOptionValue(option),
    label: String(option),
  }
}

export function normalizeOptionItems(options: readonly unknown[] | undefined) {
  return (options ?? []).map((option) => normalizeOptionItem(option))
}

export function resolveOptionSource(
  source: unknown,
  params: FormFieldCallbackParams,
): readonly FormOptionItem[] {
  if (!source) return []
  if (Array.isArray(source)) return source
  if (typeof source === 'function') {
    const value = source(params)
    if (Array.isArray(value)) return value
    return []
  }
  return []
}

function normalizeOptionValue(value: unknown): FormOptionValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value
  return String(value)
}
