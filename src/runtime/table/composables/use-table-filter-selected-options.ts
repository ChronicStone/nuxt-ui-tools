import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import { isBoolean, isNullish, isNumber, isString } from '../../shared/utils/predicate'
import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  TableFilterOptionEntry,
  TableFilterOptionValueEntry,
  TableFilterPrimitiveValue,
  TableFilterRemoteOptions,
  TableQueryDefinition,
  TableQueryStateFilterRule,
  TableUiFilterDefinition,
} from '../types'

type KnownOptions = ReadonlyMap<string, TableFilterOptionValueEntry>

interface SelectedOptionsRequest {
  key: string
  query: TableQueryDefinition<readonly TableFilterOptionEntry[]>
}

export interface UseTableFilterSelectedOptionsParams {
  definitions: ComputedRef<TableUiFilterDefinition[]>
  /** Committed filter rules. */
  rules: ComputedRef<TableQueryStateFilterRule[]>
}

/**
 * Options of the committed values of remote option filters, so tags, panel chips, and the mobile
 * sheet show labels instead of raw values. Options the editors loaded are recorded as values get
 * picked; the rest (for example values restored from the URL) resolve through each filter's
 * `source.remote.resolveSelected`, under the consumer's query key so a prefetched result is reused.
 */
export function useTableFilterSelectedOptions(params: UseTableFilterSelectedOptionsParams) {
  const queryClient = useQueryClient()
  const known = shallowRef<ReadonlyMap<string, KnownOptions>>(new Map())

  const remoteDefinitions = computed(() =>
    params.definitions.value.flatMap((definition) => {
      const remote = definition.kind === 'option' ? definition.source?.remote : undefined
      return remote ? [{ key: definition.key, remote }] : []
    }),
  )

  function selectedValues(key: string): TableFilterPrimitiveValue[] {
    const rule = params.rules.value.find((entry) => entry.key === key)
    const values = Array.isArray(rule?.value)
      ? rule.value
      : isNullish(rule?.value)
        ? []
        : [rule.value]
    return values.filter(isPrimitiveValue)
  }

  const requests = computed<SelectedOptionsRequest[]>(() =>
    remoteDefinitions.value.flatMap(({ key, remote }) => {
      const cached = known.value.get(key)
      const missing = selectedValues(key).filter((value) => !cached?.has(String(value)))
      const query = missing.length ? resolveSelectedQuery(remote, missing) : undefined
      return query ? [{ key, query }] : []
    }),
  )

  const hydration = useQuery(
    computed(() => {
      // The query function reads this snapshot, so results always match the filters they belong to.
      const snapshot = requests.value
      return {
        enabled: snapshot.length > 0,
        queryFn: () =>
          Promise.all(
            snapshot.map(async ({ key, query }) => ({
              key,
              options: await queryClient.fetchQuery({
                queryFn: (context) => {
                  if (!query.queryFn) {
                    throw new Error(
                      'resolveSelected must return a query definition with a queryFn.',
                    )
                  }
                  return query.queryFn({ ...context, direction: 'forward', pageParam: null })
                },
                queryKey: query.queryKey,
                staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
              }),
            })),
          ),
        queryKey: [
          'table-filter-selected-options',
          snapshot.map(({ key, query }) => [key, query.queryKey]),
        ],
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
      }
    }),
  )

  watch(
    () => hydration.data.value,
    (results) => {
      for (const result of results ?? []) remember(result.key, result.options)
    },
  )

  /** Records options an editor loaded, so picking one of them needs no extra request. */
  function remember(key: string, options: readonly TableFilterOptionEntry[]) {
    const entries = flattenValueEntries(options)
    if (!entries.length) return
    const current = known.value.get(key)
    if (entries.every((entry) => current?.get(String(entry.value))?.label === entry.label)) return
    const next = new Map(current)
    for (const entry of entries) next.set(String(entry.value), entry)
    known.value = new Map(known.value).set(key, next)
  }

  /** Known options of a filter's committed values, in value order. */
  function getSelectedOptions(key: string): TableFilterOptionValueEntry[] {
    const cached = known.value.get(key)
    if (!cached) return []
    return selectedValues(key).flatMap((value) => {
      const entry = cached.get(String(value))
      return entry ? [entry] : []
    })
  }

  return {
    getSelectedOptions,
    /** Options of committed values are resolving for this filter. */
    isResolving: (key: string) =>
      hydration.isFetching.value && requests.value.some((request) => request.key === key),
    remember,
  }
}

export type TableFilterSelectedOptions = ReturnType<typeof useTableFilterSelectedOptions>

function resolveSelectedQuery(
  remote: TableFilterRemoteOptions,
  values: readonly TableFilterPrimitiveValue[],
): TableQueryDefinition<readonly TableFilterOptionEntry[]> | undefined {
  return remote.resolveSelected?.({ values })
}

function flattenValueEntries(
  options: readonly TableFilterOptionEntry[],
): TableFilterOptionValueEntry[] {
  return options.flatMap((option) => [
    ...(isNullish(option.value) ? [] : [{ ...option, value: option.value }]),
    ...flattenValueEntries(option.children ?? []),
  ])
}

function isPrimitiveValue<TValue>(value: TValue): value is TValue & TableFilterPrimitiveValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
