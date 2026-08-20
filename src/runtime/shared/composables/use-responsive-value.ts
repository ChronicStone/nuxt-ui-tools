import { useNuxtApp } from 'nuxt/app'
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'

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
  type ResponsiveRuntimeValue,
  type ViewportLike,
} from '../utils/responsive'
import { isFunction, isObject, isString } from '../utils/predicate'

export function getResponsiveValue<TValue extends ResponsiveValueInput>(
  value: TValue,
): InferResponsiveValue<TValue> | null
export function getResponsiveValue<
  TTransform extends ResponsiveTransformKey | ResponsiveTransformer<ResponsiveRuntimeValue>,
>(value: string, transform: TTransform): ResponsiveTransformResult<TTransform> | null
export function getResponsiveValue(
  value: ResponsiveValueInput,
  transform?: ResponsiveTransformKey | ResponsiveTransformer<ResponsiveRuntimeValue>,
): ResponsiveValueInput | ResponsiveRuntimeValue {
  const resolvedValue = unwrapResponsiveValue(value)
  const viewport = useCurrentViewport()
  const context = {
    breakpoint: viewport.breakpoint.value,
    breakpointKeys: getOrderedBreakpointKeys(viewport),
  }

  if (!isString(resolvedValue))
    return resolveResponsiveValueAtBreakpoint(resolvedValue, context)
  if (transform === undefined) return resolveResponsiveValueAtBreakpoint(resolvedValue, context)

  return resolveResponsiveValueAtBreakpoint(resolvedValue, context, transform)
}

export function useResponsiveValue<TValue extends ResponsiveValueInput>(
  value: MaybeRefOrGetter<TValue>,
): ComputedRef<InferResponsiveValue<TValue> | null>
export function useResponsiveValue<
  TTransform extends ResponsiveTransformKey | ResponsiveTransformer<ResponsiveRuntimeValue>,
>(
  value: MaybeRefOrGetter<string>,
  transform: TTransform,
): ComputedRef<ResponsiveTransformResult<TTransform> | null>
export function useResponsiveValue(
  value: MaybeRefOrGetter<ResponsiveValueInput>,
  transform?: ResponsiveTransformKey | ResponsiveTransformer<ResponsiveRuntimeValue>,
): ComputedRef<ResponsiveValueInput | ResponsiveRuntimeValue> {
  return computed(() => {
    const resolvedValue = unwrapResponsiveValue(toValue(value))
    if (!isString(resolvedValue)) return getResponsiveValue(resolvedValue)
    if (transform === undefined) return getResponsiveValue(resolvedValue)

    return getResponsiveValue(resolvedValue, transform)
  })
}

function unwrapResponsiveValue(value: ResponsiveValueInput): string | number | boolean {
  let currentValue = value

  while (isResponsiveValueGetter(currentValue)) {
    currentValue = currentValue()
  }

  return currentValue
}

function isResponsiveValueGetter<T>(
  value: T,
): value is T & (() => ResponsiveValueInput) {
  return isFunction(value)
}

function useCurrentViewport(): ViewportLike {
  const nuxtApp = useNuxtApp()
  if (!hasViewport(nuxtApp))
    throw new Error('nuxt-viewport is required to resolve responsive values')

  return nuxtApp.$viewport
}

function hasViewport<T>(value: T): value is T & { $viewport: ViewportLike } {
  return isObject(value) && '$viewport' in value
}
