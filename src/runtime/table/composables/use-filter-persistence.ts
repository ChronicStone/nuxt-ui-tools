import { watch } from 'vue'
import type { ComputedRef, WritableComputedRef } from 'vue'

import type { TableFilterState, TableSchemaView, TableUiFilterDefinition } from '../types'
import {
  isTableFilterRuleDefault,
  parsePersistedFilterRule,
  persistedFilterStorageKey,
  serializePersistedFilterRule,
} from '../utils'

export interface UseFilterPersistenceParams {
  schema: ComputedRef<TableSchemaView>
  filters: WritableComputedRef<TableFilterState>
  /** Writes the restored state without adding a browser history entry. */
  restore: (state: TableFilterState) => void
}

/**
 * Keeps the value of every filter marked `behavior.persist` in `localStorage`. On setup, a stored
 * value replaces the default of a filter the URL does not set; afterwards each change is written
 * back, and a filter back at its default is forgotten.
 */
export function useFilterPersistence(params: UseFilterPersistenceParams) {
  const storage = resolveStorage()
  const persisted = (params.schema.value.filters?.ui ?? []).filter(
    (definition) => definition.behavior?.persist === true,
  )

  if (!storage || persisted.length === 0) {
    return
  }

  const storageKey = (definition: TableUiFilterDefinition) =>
    persistedFilterStorageKey({
      tableKey: params.schema.value.tableKey,
      filterKey: definition.key,
    })
  const current = params.filters.value.ui
  const restored = persisted.flatMap((definition) => {
    const rule = current.find((candidate) => candidate.key === definition.key)

    if (rule && !isTableFilterRuleDefault({ definition, rule })) {
      return []
    }

    const stored = parsePersistedFilterRule({
      definition,
      raw: safeRead(storage, storageKey(definition)),
    })

    return stored ? [stored] : []
  })

  if (restored.length > 0) {
    const keys = new Set(restored.map((rule) => rule.key))

    params.restore({
      ...params.filters.value,
      ui: [...current.filter((rule) => !keys.has(rule.key)), ...restored],
    })
  }

  watch(
    () => params.filters.value.ui,
    (rules) => {
      for (const definition of persisted) {
        const rule = rules.find((candidate) => candidate.key === definition.key)

        safeWrite(
          storage,
          storageKey(definition),
          rule && !isTableFilterRuleDefault({ definition, rule })
            ? serializePersistedFilterRule({ definition, rule })
            : null,
        )
      }
    },
  )
}

function resolveStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function safeRead(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(storage: Storage, key: string, value: string | null) {
  try {
    if (value === null) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, value)
    }
  } catch {
    return
  }
}
