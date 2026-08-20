import { createTextVNode, type VNodeChild } from 'vue'

import type { LazyTextValue, RenderableType } from '../types/utils'
import { isFunction, isNumber, isString } from './predicate'

export type RenderableValue<TArgs extends unknown[] = []> =
  | RenderableType
  | ((...args: TArgs) => RenderableType)

export type ResolvableTextValue = LazyTextValue

export function renderVNode<TArgs extends unknown[]>(
  value: RenderableValue<TArgs>,
  ...args: TArgs
): VNodeChild {
  const resolved = isRenderableFunction(value) ? value(...args) : value

  if (isString(resolved) || isNumber(resolved)) {
    return createTextVNode(String(resolved))
  }

  return resolved ?? null
}

function isRenderableFunction<TArgs extends unknown[]>(
  value: RenderableValue<TArgs>,
): value is (...args: TArgs) => RenderableType {
  return isFunction(value)
}

export function resolveTextValue(value: ResolvableTextValue | null | undefined, fallback = '') {
  if (isFunction(value)) return String(value())
  if (isString(value) || isNumber(value)) return String(value)
  return fallback
}
