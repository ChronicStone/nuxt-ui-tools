import { appConfig, viewport } from '../nuxt-state'

export function useNuxtApp() {
  return { $viewport: viewport }
}

export function useAppConfig() {
  return appConfig.value
}
