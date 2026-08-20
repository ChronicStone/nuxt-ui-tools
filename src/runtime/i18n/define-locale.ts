import type { Locale } from '#ui-tools/i18n/types'
import type { DeepPartial } from '#ui-tools/shared/types/utils'
import { isObject } from '#ui-tools/shared/utils/predicate'

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
  if (!isObject(base) || !isObject(extension)) {
    // SAFETY: both candidates originate from the same locale tree, so a primitive leaf keeps TMessages.
    return (extension ?? base) as TMessages
  }

  const merged = { ...base }

  for (const [key, extensionValue] of Object.entries(extension)) {
    const baseValue = merged[key]

    if (extensionValue === undefined) continue

    Object.assign(merged, {
      [key]:
        isObject(baseValue) && isObject(extensionValue)
          ? mergeLocaleMessages(baseValue, extensionValue)
          : extensionValue,
    })
  }

  // SAFETY: `merged` starts from the complete base tree and only replaces matching leaves or
  // recursively merges partial branches, so every required `TMessages` property remains present.
  return merged as TMessages
}
