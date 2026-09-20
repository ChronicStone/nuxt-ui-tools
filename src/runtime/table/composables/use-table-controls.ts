import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'

import { useResponsiveValue } from '#ui-tools/shared'

import { isBoolean, isFunction, isObject, isString } from '../../shared/utils/predicate'
import type {
  TableControlsSchema,
  TableLayout,
  TableLayoutControl,
  TableSchemaView,
} from '../types'
import type { useTableLayout } from './use-table-layout'

export interface UseTableControlsParams {
  schema: ComputedRef<TableSchemaView>
  layout: ReturnType<typeof useTableLayout>
}

export function useTableControls(options: UseTableControlsParams) {
  const columnsPanelOpen = ref<boolean>(false)
  const columnsPanelSearch = ref<string>('')

  const tableLayout = options.layout.activeLayout
  const { gridEnabled } = options.layout
  const { tableEnabled } = options.layout
  const rawControls = {
    actions: responsiveControl('actions'),
    columns: responsiveControl('columns'),
    filters: responsiveControl('filters'),
    layout: responsiveControl('layout'),
    refresh: responsiveControl('refresh'),
    sort: responsiveControl('sort'),
  }
  const headerControls = computed<Record<keyof TableControlsSchema, boolean>>(() => ({
    actions:
      Boolean(rawControls.actions[tableLayout.value].value) &&
      Boolean(options.schema.value.toolbarActions?.length),
    columns: Boolean(rawControls.columns[tableLayout.value].value) && tableLayout.value === 'table',
    filters:
      Boolean(rawControls.filters[tableLayout.value].value) &&
      Boolean(options.schema.value.filters?.ui?.length),
    layout:
      Boolean(rawControls.layout[tableLayout.value].value) &&
      gridEnabled.value &&
      tableEnabled.value,
    refresh: Boolean(rawControls.refresh[tableLayout.value].value),
    sort:
      Boolean(rawControls.sort[tableLayout.value].value) &&
      tableLayout.value === 'grid' &&
      Boolean(options.schema.value.grid?.sortOptions?.length),
  }))
  const layoutState = computed(() => {
    const available: TableLayout[] = []
    if (options.layout.tableEnabled.value) {
      available.push('table')
    }
    if (options.layout.gridEnabled.value) {
      available.push('grid')
    }
    return { active: tableLayout.value, available }
  })

  function setTableLayout(layout: TableLayout) {
    options.layout.activeLayout.value = layout
  }

  function responsiveControl(key: keyof TableControlsSchema) {
    return {
      grid: useResponsiveValue(() => resolveControl(key, 'grid'), 'boolean'),
      table: useResponsiveValue(() => resolveControl(key, 'table'), 'boolean'),
    }
  }

  function resolveControl(key: keyof TableControlsSchema, layout: TableLayout) {
    const configured = options.schema.value.controls?.[key]
    const value = isFunction(configured) ? configured() : configured

    if (value === undefined) return 'true'
    if (isBoolean(value) || isString(value)) return String(value)
    if (!isLayoutControlMap(value)) return 'true'
    return String(value[layout] ?? true)
  }

  return {
    columnsPanelOpen,
    columnsPanelSearch,
    gridEnabled,
    headerControls,
    layoutState,
    rawControls,
    setTableLayout,
    tableEnabled,
    tableLayout,
  }
}

function isLayoutControlMap(
  value: TableLayoutControl | null,
): value is Partial<Record<TableLayout, boolean | string>> {
  return isObject(value)
}
