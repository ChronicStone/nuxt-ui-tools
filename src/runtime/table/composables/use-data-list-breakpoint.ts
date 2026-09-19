import { useNuxtApp } from 'nuxt/app'
import { computed } from 'vue'

interface ViewportLike {
  breakpoint: { value: string }
  queries:
    | { value?: Record<string, { mediaQuery: string }> }
    | Record<string, { mediaQuery: string }>
  isLessThan: (breakpoint: string) => boolean
}

let synced = false

export function syncViewportBreakpoint(viewport?: ViewportLike) {
  if (synced || !('window' in globalThis)) {
    return
  }
  // SAFETY: nuxt-viewport registers $viewport with this breakpoint/queries contract when the module is installed.
  viewport ??= useNuxtApp().$viewport as ViewportLike | undefined
  if (!viewport) {
    return
  }
  synced = true
  const queries =
    'value' in viewport.queries && viewport.queries.value
      ? viewport.queries.value
      : // SAFETY: nuxt-viewport exposes plain query maps when it is not wrapped in a ref.
        (viewport.queries as Record<string, { mediaQuery: string }>)
  for (const [key, query] of Object.entries(queries ?? {})) {
    if (window.matchMedia(query.mediaQuery).matches) {
      if (viewport.breakpoint.value !== key) {
        viewport.breakpoint.value = key
      }
      return
    }
  }
}

export function useDataListBreakpoint() {
  // SAFETY: nuxt-viewport registers $viewport with this breakpoint/queries contract when the module is installed.
  const $viewport = useNuxtApp().$viewport as ViewportLike | undefined
  syncViewportBreakpoint($viewport)
  const isMobile = computed(() => Boolean($viewport?.isLessThan('md')))
  const isTablet = computed(() => Boolean($viewport?.isLessThan('lg')) && !isMobile.value)
  return { isMobile, isTablet }
}
