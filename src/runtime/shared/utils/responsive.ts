import type {
  InferResponsiveValue,
  ResponsiveBreakpointContext,
  ResponsiveTransformKey,
  ResponsiveTransformResult,
  ResponsiveTransformer,
  ResponsiveValueInput,
} from '../types/responsive'

type ResponsiveTransform = ResponsiveTransformKey | ResponsiveTransformer<unknown>

export type ViewportLike = {
  breakpoint: { value: string }
  queries: { value: Record<string, { size: number }> }
}

export function parseResponsiveValue(value: string, breakpointKeys: string[]): Record<string, string | null> {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const separatorIndex = token.indexOf(':')

      if (separatorIndex === -1) return { breakpoint: breakpointKeys[0] ?? '', value: token }

      return {
        breakpoint: token.slice(0, separatorIndex),
        value: token.slice(separatorIndex + 1),
      }
    })

  return breakpointKeys.reduce<Record<string, string | null>>((acc, breakpoint, index) => {
    let resolvedValue = tokens.find((token) => token.breakpoint === breakpoint)?.value ?? null

    if (resolvedValue) {
      acc[breakpoint] = resolvedValue
      return acc
    }

    let fallbackIndex = index - 1
    while (fallbackIndex >= 0 && resolvedValue === null) {
      resolvedValue =
        tokens.find((token) => token.breakpoint === breakpointKeys[fallbackIndex])?.value ?? null
      fallbackIndex--
    }

    acc[breakpoint] = resolvedValue
    return acc
  }, {})
}

export function resolveResponsiveValueAtBreakpoint<TValue extends ResponsiveValueInput>(
  value: TValue,
  context: ResponsiveBreakpointContext,
): InferResponsiveValue<TValue> | null
export function resolveResponsiveValueAtBreakpoint<TTransform extends ResponsiveTransform>(
  value: string,
  context: ResponsiveBreakpointContext,
  transform: TTransform,
): ResponsiveTransformResult<TTransform> | null
export function resolveResponsiveValueAtBreakpoint(
  value: ResponsiveValueInput,
  context: ResponsiveBreakpointContext,
  transform?: ResponsiveTransform,
): unknown | null {
  if (typeof value !== 'string') return value

  const resolvedValue = parseResponsiveValue(value, context.breakpointKeys)[context.breakpoint] ?? null
  if (resolvedValue === null) return null

  return transformResponsiveValue(resolvedValue, transform)
}

export function getOrderedBreakpointKeys(viewport: ViewportLike): string[] {
  return Object.entries(viewport.queries.value)
    .sort(([, leftQuery], [, rightQuery]) => leftQuery.size - rightQuery.size)
    .map(([breakpoint]) => breakpoint)
}

function transformResponsiveValue(value: string, transform?: ResponsiveTransform): unknown {
  if (transform === undefined || transform === 'string') return value
  if (typeof transform === 'function') return transform(value)
  if (transform === 'boolean') return value === 'true'
  if (transform === 'integer') return Number.parseInt(value, 10)
  if (transform === 'float') return Number.parseFloat(value)
  if (transform === 'grid-cols')
    return `grid-template-columns: repeat(${value}, minmax(0, 1fr))`
  if (transform === 'grid-rows')
    return `grid-template-rows: repeat(${value}, minmax(0, 1fr))`
  if (transform === 'col') return `grid-column: span ${value} / span ${value}`
  if (transform === 'row') return `grid-row: span ${value} / span ${value}`
  if (transform === 'maxWidth') return `max-width: ${value}`

  return `max-height: ${value}`
}
