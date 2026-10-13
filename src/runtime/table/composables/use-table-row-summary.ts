import { useCookie } from 'nuxt/app'
import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'

import { useResponsiveValue } from '#ui-tools/shared'

import { isFunction } from '../../shared/utils/predicate'
import {
  TABLE_SUMMARY_DEFAULT_ENABLED,
  TABLE_SUMMARY_PREFERENCE_MAX_AGE,
} from '../constants/summary'
import type { TableSchemaView } from '../types'
import type { useTableLayout } from './use-table-layout'
import type { useTableTree } from './use-table-tree'

export interface UseTableRowSummaryParams {
  schema: ComputedRef<TableSchemaView>
  layout: ReturnType<typeof useTableLayout>
  tree: ReturnType<typeof useTableTree>
}

/** Summary rows are the default view, so only a reader's move to the table is remembered. */
type TableSummaryChoice = 'table' | null

/**
 * Decides whether the table layout reads as summary rows. `available` is what the schema and the
 * viewport allow; `active` also honours the reader's choice, which the toggle changes.
 */
export function useTableRowSummary(params: UseTableRowSummaryParams) {
  const summary = computed(() => params.schema.value.table?.summary)
  const enabled = useResponsiveValue(() => {
    const configured = summary.value?.enabled
    const resolved = isFunction(configured) ? configured() : configured
    return String(resolved ?? TABLE_SUMMARY_DEFAULT_ENABLED)
  }, 'boolean')
  /* Tree rows need the columns: the rail and the chevrons live in the tree column. */
  const available = computed(
    () =>
      summary.value !== undefined &&
      !params.tree.enabled.value &&
      params.layout.tableEnabled.value &&
      params.layout.activeLayout.value === 'table' &&
      (enabled.value ?? true),
  )

  const persistPreferences = computed(() => params.schema.value.persistence?.preferences !== false)
  /* A cookie name only takes printable ASCII without spaces, `;` or `=`: a free-form key is encoded. */
  const cookieName = `${encodeURIComponent(params.schema.value.tableKey)}::view`
  const stored = useCookie<TableSummaryChoice>(cookieName, {
    decode: (value) => (value === 'table' ? 'table' : null),
    default: () => null,
    encode: (value) => value ?? '',
    maxAge: TABLE_SUMMARY_PREFERENCE_MAX_AGE,
  })
  const session = ref<TableSummaryChoice>(null)
  const choice = computed<TableSummaryChoice>({
    get: () => (persistPreferences.value ? stored.value : session.value),
    set: (next) => {
      if (persistPreferences.value) stored.value = next
      else session.value = next
    },
  })

  const active = computed(() => available.value && choice.value === null)

  function setActive(next: boolean) {
    if (!available.value) return
    choice.value = next ? null : 'table'
  }

  return { active, available, setActive }
}
