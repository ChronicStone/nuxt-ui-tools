import { ref } from 'vue'

export const localeCode = ref('en')

export function useLocale() {
  return { code: localeCode, dir: ref('ltr') }
}
