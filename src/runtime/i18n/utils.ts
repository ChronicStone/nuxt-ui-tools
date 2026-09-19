import { computed, unref } from 'vue'
import type { MaybeRef, Ref } from 'vue'

import type { UiToolsDirection, UiToolsLocale } from '#ui-tools/i18n/types'
import { getObjectProperty } from '#ui-tools/shared/utils/object'
import { isString } from '#ui-tools/shared/utils/predicate'

export type UiToolsTranslatorOption = Record<string, string | number>
export type UiToolsTranslator = (path: string, option?: UiToolsTranslatorOption) => string

export interface UiToolsLocaleContext<TMessages> {
  locale: Ref<UiToolsLocale<TMessages>>
  lang: Ref<string>
  dir: Ref<UiToolsDirection>
  code: Ref<string>
  t: UiToolsTranslator
}

export function translateUiToolsMessage<TMessages>(
  path: string,
  option: UiToolsTranslatorOption | undefined,
  locale: UiToolsLocale<TMessages>,
) {
  const message = getObjectProperty(locale.messages, path)

  if (!isString(message)) {
    return path
  }

  return message.replaceAll(/\{(\w+)\}/gu, (_, key: string) => `${option?.[key] ?? `{${key}}`}`)
}

export function buildUiToolsTranslator<TMessages>(
  locale: MaybeRef<UiToolsLocale<TMessages>>,
): UiToolsTranslator {
  return (path, option) => translateUiToolsMessage(path, option, unref(locale))
}

export function buildUiToolsLocaleContext<TMessages>(
  locale: MaybeRef<UiToolsLocale<TMessages>>,
): UiToolsLocaleContext<TMessages> {
  const localeRef = computed(() => unref(locale))

  return {
    code: computed(() => unref(locale).code),
    dir: computed(() => unref(locale).dir),
    lang: computed(() => unref(locale).name),
    locale: localeRef,
    t: buildUiToolsTranslator(locale),
  }
}
