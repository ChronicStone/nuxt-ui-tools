import { createTextVNode, type VNodeChild } from 'vue'

import type { RenderableType } from '../types/utils'

export type RenderableValue<TArgs extends unknown[] = []> =
  | RenderableType
  | ((...args: TArgs) => RenderableType)

export type ResolvableTextValue = string | number | (() => string | number)

export function renderVNode<TArgs extends unknown[]>(
  value: RenderableValue<TArgs>,
  ...args: TArgs
): VNodeChild {
  const resolved = typeof value === 'function' ? value(...args) : value

  if (typeof resolved === 'string' || typeof resolved === 'number') {
    return createTextVNode(String(resolved))
  }

  return resolved ?? null
}

export function resolveTextValue(
  value: ResolvableTextValue | null | undefined,
  fallback = '',
) {
  if (typeof value === 'function') return String(value())
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return fallback
}
