import { computed, ref } from 'vue'

export const BREAKPOINTS = { lg: 1024, md: 768, sm: 640, xl: 1280, xs: 0 } as const
export type BreakpointKey = keyof typeof BREAKPOINTS

const order: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl']
const breakpoint = ref<BreakpointKey>('xl')

function mediaQueryFor(index: number) {
  const min = BREAKPOINTS[order[index]!]
  const next = order[index + 1]
  return next
    ? `(min-width: ${min}px) and (max-width: ${BREAKPOINTS[next] - 1}px)`
    : `(min-width: ${min}px)`
}

export function currentMediaQuery() {
  return viewport.queries.value[breakpoint.value]!.mediaQuery
}

export const viewport = {
  breakpoint,
  isGreaterOrEquals: (key: string) =>
    order.indexOf(breakpoint.value) >= order.indexOf(key as BreakpointKey),
  isLessThan: (key: string) =>
    order.indexOf(breakpoint.value) < order.indexOf(key as BreakpointKey),
  queries: {
    value: Object.fromEntries(
      order.map((key, index) => [
        key,
        { mediaQuery: mediaQueryFor(index), size: BREAKPOINTS[key] },
      ]),
    ),
  },
}

export const appConfig = ref<Record<string, unknown>>({})

export function setBreakpoint(key: BreakpointKey) {
  breakpoint.value = key
}

export function setAppConfig(value: Record<string, unknown>) {
  appConfig.value = value
}

export const isMobileViewport = computed(() => viewport.isLessThan('md'))
