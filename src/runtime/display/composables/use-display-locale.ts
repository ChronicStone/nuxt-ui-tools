import { useUiToolsLocale } from '../../i18n/use-locale'

/** The ui-tools translator plus the locale code used by the `Intl` formatters. */
export function useDisplayLocale() {
  const locale = useUiToolsLocale()
  return { code: locale.code, t: locale.t }
}
