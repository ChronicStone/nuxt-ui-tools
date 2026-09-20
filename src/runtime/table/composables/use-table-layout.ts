import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import { useQueryState, createEnumCodec } from '#ui-tools/query-state'
import { useResponsiveValue } from '#ui-tools/shared'

import { isFunction } from '../../shared/utils/predicate'
import type { TableLayout, TableSchemaView } from '../types'
import { syncViewportBreakpoint } from './use-data-list-breakpoint'

interface UseTableLayoutParams {
  schema: ComputedRef<TableSchemaView>
}

function resolveEnabled(
  value: boolean | string | (() => boolean | string) | undefined,
  fallback: boolean,
) {
  const resolved = isFunction(value) ? value() : value
  return resolved ?? fallback
}

export function useTableLayout({ schema }: UseTableLayoutParams) {
  syncViewportBreakpoint()
  const defaultLayout = computed(() => schema.value.defaultLayout ?? 'table')
  const gridEnabledRaw = useResponsiveValue(
    () => String(resolveEnabled(schema.value.grid?.enabled, Boolean(schema.value.grid))),
    'boolean',
  )
  const tableEnabledRaw = useResponsiveValue(
    () => String(resolveEnabled(schema.value.table?.enabled, Boolean(schema.value.table))),
    'boolean',
  )
  const gridEnabled = computed(() => gridEnabledRaw.value ?? Boolean(schema.value.grid))
  const tableEnabled = computed(() => tableEnabledRaw.value ?? Boolean(schema.value.table))

  const activeLayout = useQueryState({
    codec: createEnumCodec(['grid', 'table'] as const),
    defaultValue: defaultLayout.value,
    key: 'l',
    omitDefault: true,
  })

  const effectiveLayout = computed<TableLayout>({
    get: () => {
      const grid = gridEnabled.value
      const table = tableEnabled.value
      const chosen = activeLayout.value
      if (chosen === 'grid' && !grid && table) {
        return 'table'
      }
      if (chosen === 'table' && !table && grid) {
        return 'grid'
      }
      return chosen
    },
    set: (layout) => {
      activeLayout.value = layout
    },
  })

  return {
    activeLayout: effectiveLayout,
    gridEnabled,
    tableEnabled,
  }
}
