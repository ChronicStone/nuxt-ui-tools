import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { QueryFunction, QueryKey } from '@tanstack/vue-query'
import { useLocalStorage } from '@vueuse/core'
import { useNuxtApp } from 'nuxt/app'
import { computed, inject } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'

/** What one person keeps for one table. */
export interface TablePreferences {
  favoriteFilters: readonly string[]
}

/** Every table's preferences for the signed-in person, keyed by `tableKey`. */
export type TablePreferencesMap = Record<string, TablePreferences | undefined>

/**
 * Where table preferences live. The app hands its own query and mutation options; the table keeps
 * the cache, applies a change at once, and rolls it back when the mutation fails.
 */
export interface TablePreferenceStore<TVariables = unknown> {
  /** Reads every table's preferences in one request. */
  query: () => { queryKey: QueryKey; queryFn?: QueryFunction<TablePreferencesMap> | unknown }
  /** Saves one table's preferences. */
  mutation: () => { mutationFn?: ((variables: TVariables) => Promise<unknown>) | unknown }
  /** Turns one table's change into the mutation's variables. */
  variables: (input: { tableKey: string; preferences: TablePreferences }) => TVariables
}

/** Keeps preferences in this browser only (`localStorage`), with no API. */
export interface TableLocalPreferenceStore {
  storage: 'local'
}

export const tablePreferenceStoreKey: InjectionKey<
  TablePreferenceStore | TableLocalPreferenceStore
> = Symbol('nuxt-ui-tools-table-preferences')

/**
 * Turns favorite filters on, for every table with a `tableKey`. Call once from a Nuxt plugin, with
 * the app's own query and mutation options, or `{ storage: 'local' }` to keep them in the browser.
 * Without this call, tables show no stars.
 */
export function provideTablePreferences<TVariables>(
  store: TablePreferenceStore<TVariables> | TableLocalPreferenceStore,
) {
  // SAFETY: the store is only read back through its own query, mutation and variables functions.
  useNuxtApp().vueApp.provide(tablePreferenceStoreKey, store as TablePreferenceStore)
}

export interface TableFavoriteFilters {
  /** False until the app calls `provideTablePreferences`. */
  enabled: boolean
  keys: ComputedRef<readonly string[]>
  isFavorite: (key: string) => boolean
  toggle: (key: string) => void
}

export function useTableFavoriteFilters(params: {
  tableKey: ComputedRef<string | undefined>
}): TableFavoriteFilters {
  const store = inject(tablePreferenceStoreKey, null)

  if (!store) {
    const none = computed<readonly string[]>(() => [])
    return { enabled: false, isFavorite: () => false, keys: none, toggle: () => undefined }
  }

  const favorites =
    'storage' in store
      ? useBrowserFavorites({ tableKey: params.tableKey })
      : useStoredFavorites({ store, tableKey: params.tableKey })

  function toggle(key: string) {
    const current = favorites.keys.value
    favorites.set(
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  return {
    enabled: true,
    keys: favorites.keys,
    isFavorite: (key) => favorites.keys.value.includes(key),
    toggle,
  }
}

function useStoredFavorites(params: {
  store: TablePreferenceStore
  tableKey: ComputedRef<string | undefined>
}) {
  const queryClient = useQueryClient()
  const queryOptions = params.store.query()
  // SAFETY: the app's query options resolve to the preferences map this store contract describes.
  const query = useQuery({
    ...(queryOptions as { queryKey: QueryKey; queryFn: QueryFunction<TablePreferencesMap> }),
    staleTime: Number.POSITIVE_INFINITY,
  })
  // SAFETY: the app's mutation options take the variables its own `variables` function builds.
  const mutation = useMutation(
    params.store.mutation() as { mutationFn: (variables: unknown) => Promise<unknown> },
  )
  const keys = computed<readonly string[]>(() =>
    params.tableKey.value ? (query.data.value?.[params.tableKey.value]?.favoriteFilters ?? []) : [],
  )

  function set(next: readonly string[]) {
    const tableKey = params.tableKey.value
    if (!tableKey) {
      return
    }
    const previous = queryClient.getQueryData<TablePreferencesMap>(queryOptions.queryKey)
    const preferences: TablePreferences = { favoriteFilters: next }

    queryClient.setQueryData<TablePreferencesMap>(queryOptions.queryKey, {
      ...previous,
      [tableKey]: preferences,
    })
    mutation.mutate(params.store.variables({ tableKey, preferences }), {
      onError: () => {
        queryClient.setQueryData(queryOptions.queryKey, previous)
      },
    })
  }

  return { keys, set }
}

function useBrowserFavorites(params: { tableKey: ComputedRef<string | undefined> }) {
  const stored = useLocalStorage<Record<string, string[]>>('nuxt-ui-tools::favorite-filters', {})
  const keys = computed<readonly string[]>(() =>
    params.tableKey.value ? (stored.value[params.tableKey.value] ?? []) : [],
  )

  function set(next: readonly string[]) {
    const tableKey = params.tableKey.value
    if (!tableKey) {
      return
    }
    stored.value = { ...stored.value, [tableKey]: [...next] }
  }

  return { keys, set }
}
