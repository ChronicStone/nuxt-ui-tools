import { computed, type ComputedRef } from 'vue'

import { useResponsiveValue } from '../../shared/composables/use-responsive-value'
import type { FormContainerLayout, FormItemLayout, FormLayoutConfig } from '../types'
import {
  FORM_LAYOUT_DEFAULTS,
  normalizeFormGridColumnSpanStyle,
  normalizeFormGridColumnsStyle,
  normalizeFormLayoutGap,
} from '../utils/layout'

export function useFormGridLayout(params: { layout: ComputedRef<FormLayoutConfig> }) {
  const columns = useResponsiveValue(
    () => String(params.layout.value.columns ?? FORM_LAYOUT_DEFAULTS.columns),
    normalizeFormGridColumnsStyle,
  )

  const style = computed(() =>
    [
      'display: grid',
      columns.value ?? normalizeFormGridColumnsStyle(String(FORM_LAYOUT_DEFAULTS.columns)),
      `gap: ${normalizeFormLayoutGap(params.layout.value.gap)}`,
    ].join('; '),
  )

  return {
    columns,
    style,
  }
}

export function useFormItemLayout(params: {
  layout: () => FormItemLayout | undefined
  formLayout: ComputedRef<FormLayoutConfig>
}) {
  const span = useResponsiveValue(
    () =>
      String(
        params.layout()?.span ??
          params.formLayout.value.fieldSpan ??
          FORM_LAYOUT_DEFAULTS.fieldSpan,
      ),
    normalizeFormGridColumnSpanStyle,
  )

  const style = computed(
    () => span.value ?? normalizeFormGridColumnSpanStyle(String(FORM_LAYOUT_DEFAULTS.fieldSpan)),
  )

  return {
    span,
    style,
  }
}

export function useFormContainerLayout(params: {
  layout: () => FormContainerLayout | undefined
  formLayout: ComputedRef<FormLayoutConfig>
}) {
  const columns = useResponsiveValue(
    () =>
      String(
        params.layout()?.columns ?? params.formLayout.value.columns ?? FORM_LAYOUT_DEFAULTS.columns,
      ),
    normalizeFormGridColumnsStyle,
  )

  const style = computed(() =>
    [
      'display: grid',
      columns.value ?? normalizeFormGridColumnsStyle(String(FORM_LAYOUT_DEFAULTS.columns)),
      `gap: ${normalizeFormLayoutGap(FORM_LAYOUT_DEFAULTS.gap)}`,
    ].join('; '),
  )

  return {
    columns,
    style,
  }
}
