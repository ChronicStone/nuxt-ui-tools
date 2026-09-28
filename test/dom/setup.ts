import { config } from '@vue/test-utils'

import { matchesMedia } from './nuxt-state'
import { localeCode } from './stubs/nuxt-ui-locale'

localeCode.value = 'fr'

config.global.stubs = { Teleport: true }

if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(globalThis, { ResizeObserver: ResizeObserverStub })
}

window.matchMedia = (query: string) =>
  ({
    addEventListener() {},
    matches: matchesMedia(query),
    media: query,
    removeEventListener() {},
  }) as unknown as MediaQueryList
