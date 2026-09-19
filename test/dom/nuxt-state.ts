import { computed, ref } from 'vue'

export const BREAKPOINTS = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } as const
export type BreakpointKey = keyof typeof BREAKPOINTS

const order = Object.keys(BREAKPOINTS) as BreakpointKey[]
const breakpoint = ref<BreakpointKey>('xl')

function mediaQueryFor(index: number) {
  const min = BREAKPOINTS[order[index]!]
  const next = order[index + 1]
  return next ? `(min-width: ${min}px) and (max-width: ${BREAKPOINTS[next] - 1}px)` : `(min-width: ${min}px)`
}

export function currentMediaQuery() {
  return viewport.queries.value[breakpoint.value]!.mediaQuery
}

export const viewport = {
  breakpoint,
  queries: {
    value: Object.fromEntries(
      order.map((key, index) => [
        key,
        { size: BREAKPOINTS[key], mediaQuery: mediaQueryFor(index) },
      ]),
    ),
  },
  isLessThan: (key: string) => order.indexOf(breakpoint.value) < order.indexOf(key as BreakpointKey),
  isGreaterOrEquals: (key: string) =>
    order.indexOf(breakpoint.value) >= order.indexOf(key as BreakpointKey),
}

export const appConfig = ref<Record<string, unknown>>({})

export function setBreakpoint(key: BreakpointKey) {
  breakpoint.value = key
}

export function setAppConfig(value: Record<string, unknown>) {
  appConfig.value = value
}

export const isMobileViewport = computed(() => viewport.isLessThan('md'))
