import { useLocale as useNuxtUiLocale } from '@nuxt/ui/composables/useLocale'
import { computed, getCurrentInstance, inject, provide } from 'vue'
import type { InjectionKey, Ref } from 'vue'

import { fr } from './locales'
import en from './locales/en'
import type { Locale, Messages } from './types'
import { buildUiToolsLocaleContext } from './utils'

export const uiToolsLocaleContextInjectionKey: InjectionKey<Ref<Locale<Messages> | undefined>> =
  Symbol.for('nuxt-ui-tools.locale-context')

let fallbackLocale: Ref<Locale<Messages> | undefined> | null = null

export function useUiToolsLocaleRef(localeOverrides?: Ref<Locale<Messages> | undefined>) {
  const instance = getCurrentInstance()
  const nuxtUiLocale = instance ? useNuxtUiLocale() : null
  const injectedLocale = instance ? inject(uiToolsLocaleContextInjectionKey, null) : fallbackLocale

  return computed(
    () =>
      localeOverrides?.value ??
      injectedLocale?.value ??
      resolveUiToolsLocale({
        code: nuxtUiLocale?.code.value,
        dir: nuxtUiLocale?.dir.value,
      }),
  )
}

export function useUiToolsLocale(localeOverrides?: Ref<Locale<Messages> | undefined>) {
  const locale = useUiToolsLocaleRef(localeOverrides)

  return buildUiToolsLocaleContext<Messages>(computed(() => locale.value || en))
}

export function provideUiToolsLocale(locale: Ref<Locale<Messages> | undefined>) {
  fallbackLocale = locale
  provide(uiToolsLocaleContextInjectionKey, locale)
}

const uiToolsLocales = [en, fr]

function resolveUiToolsLocale(params: { code?: string; dir?: Locale['dir'] }) {
  const normalizedCode = normalizeLocaleCode(params.code)
  const matchedLocale =
    uiToolsLocales.find((locale) => normalizeLocaleCode(locale.code) === normalizedCode) ??
    uiToolsLocales.find(
      (locale) => normalizeLocaleCode(locale.code) === normalizedCode.split('_')[0],
    ) ??
    en

  return {
    ...matchedLocale,
    dir: params.dir ?? matchedLocale.dir,
  }
}

function normalizeLocaleCode(value: string | undefined) {
  return String(value ?? en.code)
    .replaceAll('-', '_')
    .toLowerCase()
}
