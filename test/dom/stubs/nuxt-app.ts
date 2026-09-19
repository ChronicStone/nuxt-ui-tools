import { ref, type Ref } from 'vue'

import { appConfig, viewport } from '../nuxt-state'

const cookies = new Map<string, Ref<unknown>>()

export function useNuxtApp() {
  return { $viewport: viewport }
}

export function useAppConfig() {
  return appConfig.value
}

export function useCookie<T>(name: string, options?: { default?: () => T }) {
  const existing = cookies.get(name)
  if (existing) {
    return existing as Ref<T>
  }
  const created = ref(options?.default ? options.default() : null) as Ref<T>
  cookies.set(name, created)
  return created
}

export function resetCookies() {
  cookies.clear()
}
