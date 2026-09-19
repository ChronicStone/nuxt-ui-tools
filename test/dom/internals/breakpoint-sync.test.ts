import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setBreakpoint, viewport } from '../nuxt-state'

describe('viewport breakpoint sync', () => {
  beforeEach(() => {
    vi.resetModules()
    setBreakpoint('xl')
  })

  it('aligns the nuxt-viewport breakpoint with the media query that matches at boot', async () => {
    const matching = viewport.queries.value.sm!.mediaQuery
    const original = window.matchMedia
    window.matchMedia = (query: string) => ({ matches: query === matching, media: query }) as unknown as MediaQueryList
    const { syncViewportBreakpoint } = await import('#ui-tools/table/composables/use-data-list-breakpoint')
    syncViewportBreakpoint(viewport)
    expect(viewport.breakpoint.value).toBe('sm')
    window.matchMedia = original
  })

  it('only syncs once per runtime', async () => {
    const original = window.matchMedia
    let probe = viewport.queries.value.md!.mediaQuery
    window.matchMedia = (query: string) => ({ matches: query === probe, media: query }) as unknown as MediaQueryList
    const { syncViewportBreakpoint } = await import('#ui-tools/table/composables/use-data-list-breakpoint')
    syncViewportBreakpoint(viewport)
    expect(viewport.breakpoint.value).toBe('md')
    probe = viewport.queries.value.lg!.mediaQuery
    syncViewportBreakpoint(viewport)
    expect(viewport.breakpoint.value).toBe('md')
    window.matchMedia = original
  })

  it('leaves the breakpoint alone when nothing matches', async () => {
    const original = window.matchMedia
    window.matchMedia = (query: string) => ({ matches: false, media: query }) as unknown as MediaQueryList
    const { syncViewportBreakpoint } = await import('#ui-tools/table/composables/use-data-list-breakpoint')
    syncViewportBreakpoint(viewport)
    expect(viewport.breakpoint.value).toBe('xl')
    window.matchMedia = original
  })
})
