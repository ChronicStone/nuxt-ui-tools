import type { Locale } from '#ui-tools/i18n/types'
import type { DeepPartial } from '#ui-tools/shared/types/utils'

interface DefineUiToolsLocaleOptions<TMessages> {
  name: string
  code: string
  dir?: 'ltr' | 'rtl'
  messages: TMessages
}

export function defineUiToolsLocale<TMessages>(
  options: DefineUiToolsLocaleOptions<TMessages>,
): Locale<TMessages> {
  return {
    ...options,
    dir: options.dir ?? 'ltr',
  }
}

export function extendUiToolsLocale<TMessages>(
  locale: Locale<TMessages>,
  options: Partial<DefineUiToolsLocaleOptions<DeepPartial<TMessages>>>,
): Locale<TMessages> {
  return {
    ...locale,
    ...options,
    dir: options.dir ?? locale.dir,
    messages: mergeLocaleMessages(locale.messages, options.messages),
  }
}

export const defineLocale = defineUiToolsLocale
export const extendLocale = extendUiToolsLocale

function mergeLocaleMessages<TMessages>(
  base: TMessages,
  extension: DeepPartial<TMessages> | undefined,
): TMessages {
  if (!extension) return base
  if (!isObject(base) || !isObject(extension)) return (extension ?? base) as TMessages

  const merged: Record<string, unknown> = { ...base }

  for (const key of Object.keys(extension)) {
    const baseValue = merged[key]
    const extensionValue = extension[key as keyof typeof extension]

    if (extensionValue === undefined) continue

    merged[key] = isObject(baseValue) && isObject(extensionValue)
      ? mergeLocaleMessages(baseValue, extensionValue)
      : extensionValue
  }

  return merged as TMessages
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
