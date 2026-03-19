import type { ModuleOptions as ViewportOptions } from 'nuxt-viewport'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    viewport?: Partial<ViewportOptions>
  }

  interface NuxtOptions {
    viewport?: Partial<ViewportOptions>
  }
}
