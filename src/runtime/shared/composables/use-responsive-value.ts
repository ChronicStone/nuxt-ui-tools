import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useNuxtApp } from 'nuxt/app'

import type {
  InferResponsiveValue,
  ResponsiveTransformResult,
  ResponsiveTransformKey,
  ResponsiveValueInput,
  ResponsiveTransformer,
} from '../types/responsive'
import {
  getOrderedBreakpointKeys,
  resolveResponsiveValueAtBreakpoint,
  type ViewportLike,
} from '../utils/responsive'

export function getResponsiveValue<TValue extends ResponsiveValueInput>(
  value: TValue,
): InferResponsiveValue<TValue> | null
export function getResponsiveValue<
  TTransform extends ResponsiveTransformKey | ResponsiveTransformer<unknown>,
>(
  value: string,
  transform: TTransform,
): ResponsiveTransformResult<TTransform> | null
export function getResponsiveValue(
  value: ResponsiveValueInput,
  transform?: ResponsiveTransformKey | ResponsiveTransformer<unknown>,
): unknown | null {
  const viewport = useCurrentViewport()
  const context = {
    breakpoint: viewport.breakpoint.value,
    breakpointKeys: getOrderedBreakpointKeys(viewport),
  }

  if (typeof value !== 'string') return resolveResponsiveValueAtBreakpoint(value, context)
  if (transform === undefined) return resolveResponsiveValueAtBreakpoint(value, context)

  return resolveResponsiveValueAtBreakpoint(value, context, transform)
}

export function useResponsiveValue<TValue extends ResponsiveValueInput>(
  value: MaybeRefOrGetter<TValue>,
): ComputedRef<InferResponsiveValue<TValue> | null>
export function useResponsiveValue<
  TTransform extends ResponsiveTransformKey | ResponsiveTransformer<unknown>,
>(
  value: MaybeRefOrGetter<string>,
  transform: TTransform,
): ComputedRef<ResponsiveTransformResult<TTransform> | null>
export function useResponsiveValue(
  value: MaybeRefOrGetter<ResponsiveValueInput>,
  transform?: ResponsiveTransformKey | ResponsiveTransformer<unknown>,
): ComputedRef<unknown | null> {
  return computed(() => {
    const resolvedValue = toValue(value)
    if (typeof resolvedValue !== 'string') return getResponsiveValue(resolvedValue)
    if (transform === undefined) return getResponsiveValue(resolvedValue)

    return getResponsiveValue(resolvedValue, transform)
  })
}

function useCurrentViewport(): ViewportLike {
  const nuxtApp = useNuxtApp()
  if (!hasViewport(nuxtApp)) throw new Error('nuxt-viewport is required to resolve responsive values')

  return nuxtApp.$viewport
}

function hasViewport(value: unknown): value is { $viewport: ViewportLike } {
  return typeof value === 'object' && value !== null && '$viewport' in value
}
