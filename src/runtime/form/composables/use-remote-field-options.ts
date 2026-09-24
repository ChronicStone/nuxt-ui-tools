import { hashKey, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient } from '@tanstack/vue-query'
import { debounceFilter, watchWithFilter } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type {
  FormValue,
  FormFieldApi,
  FormFieldCallbackParams,
  FormOptionValue,
  FormRemoteOptionConfig,
  FormRuntimeQueryOptions,
} from '../types'
import { formOptionKey, mergeResolvedOptions, normalizeOptionItems } from '../utils/options'
import type { FormOptionKeys, ResolvedFormOption } from '../utils/options'
import { isRecord } from '../utils/path'
import {
  isBoolean,
  isFunction,
  isNumber,
  isPromise,
  isString,
  isUndefined,
} from '../utils/predicate'

const DEFAULT_SEARCH_DEBOUNCE = 250

interface RemotePage {
  options: readonly ResolvedFormOption[]
  hasMore: boolean
  nextCursor: string | null
}

export interface UseRemoteFieldOptionsParams {
  config: ComputedRef<FormRemoteOptionConfig<FormValue> | null>
  api: ComputedRef<FormFieldApi>
  callbackParams: ComputedRef<FormFieldCallbackParams>
  optionKeys: ComputedRef<FormOptionKeys>
  multiple: () => boolean
}

export function useRemoteFieldOptions(params: UseRemoteFieldOptionsParams) {
  const queryClient = resolveQueryClient()
  const loaded = shallowRef<readonly ResolvedFormOption[]>([])
  const retained = shallowRef<readonly ResolvedFormOption[]>([])
  const rawOptions = new Map<string, FormValue>()
  const searchInput = ref<string>('')
  const search = ref<string>('')
  const pageIndex = ref<number>(1)
  const cursor = ref<string | null>(null)
  const nextCursor = ref<string | null>(null)
  const hasMore = ref<boolean>(false)
  const active = ref<boolean>(false)
  const generation = ref<number>(0)
  const selectionGeneration = ref<number>(0)
  const selectedRun = ref<number>(0)
  const sourceFetching = ref<boolean>(false)
  const loadingMore = ref<boolean>(false)
  const selectedFetching = ref<boolean>(false)
  const sourceError = shallowRef<FormValue | null>(null)
  const selectedError = shallowRef<FormValue | null>(null)
  const failedPage = shallowRef<{ index: number; cursor: string | null } | null>(null)
  const childRequests = new Map<string, Promise<void>>()

  const enabled = computed<boolean>(() => params.config.value !== null)
  const pageSize = computed<number>(() => Math.max(1, params.config.value?.pagination.size ?? 25))
  const paginationType = computed(() => params.config.value?.pagination.type ?? 'page')
  const prefetchDistance = computed<number | 'viewport'>(
    () => params.config.value?.pagination.prefetchDistance ?? 'viewport',
  )
  const minLength = computed<number>(() => Math.max(0, params.config.value?.search?.minLength ?? 0))
  const canFetch = computed<boolean>(
    () => search.value.length === 0 || search.value.length >= minLength.value,
  )

  const selectedValues = computed<readonly FormOptionValue[]>(() => {
    const value = params.api.value.value.get()
    if (Array.isArray(value)) {
      return value.filter(isOptionValue)
    }
    return isOptionValue(value) ? [value] : []
  })
  const selectedItems = computed<readonly ResolvedFormOption[]>(() => {
    const keys = new Set(selectedValues.value.map(formOptionKey))
    return mergeResolvedOptions(
      flatten(retained.value).filter((option) => keys.has(formOptionKey(option.value))),
      flatten(loaded.value).filter((option) => keys.has(formOptionKey(option.value))),
    )
  })
  const items = computed<readonly ResolvedFormOption[]>(() =>
    mergeResolvedOptions(selectedItems.value, loaded.value),
  )
  const missingSelected = computed<readonly FormOptionValue[]>(() => {
    const known = new Set(
      [...flatten(retained.value), ...flatten(loaded.value)].map((option) =>
        formOptionKey(option.value),
      ),
    )
    return selectedValues.value.filter((value) => !known.has(formOptionKey(value)))
  })
  const pending = computed<boolean>(
    () =>
      enabled.value &&
      active.value &&
      canFetch.value &&
      sourceFetching.value &&
      loaded.value.length === 0 &&
      sourceError.value === null,
  )
  const fetching = computed<boolean>(
    () => enabled.value && (sourceFetching.value || selectedFetching.value),
  )
  const errorValue = computed<FormValue | null>(() =>
    enabled.value ? (sourceError.value ?? selectedError.value) : null,
  )
  const retryable = computed<boolean>(
    () => enabled.value && !fetching.value && errorValue.value !== null,
  )

  function resolveSelectedRequest(values: readonly FormOptionValue[]) {
    const config = params.config.value
    if (!config?.resolveSelected) {
      return null
    }
    return config.resolveSelected({ ...params.callbackParams.value, values })
  }

  async function resolveRemoteResult(source: FormValue): Promise<FormValue> {
    if (isPromise(source)) {
      return await source
    }
    if (!isRuntimeQueryOptions(source)) {
      return source
    }
    if (!queryClient) {
      throw new Error('Remote option sources returning query options need a TanStack QueryClient')
    }
    const { select, ...fetchOptions } = source
    const data = await queryClient.fetchQuery(fetchOptions)
    return isFunction(select) ? select(data) : data
  }

  function parsePage(result: FormValue): RemotePage {
    if (!isRecord(result) || !Array.isArray(result.options)) {
      throw new TypeError('Remote option sources must resolve to an object with an options array')
    }
    const options = normalizeOptionItems(result.options, params.optionKeys.value)
    for (const [index, option] of options.entries()) {
      rawOptions.set(formOptionKey(option.value), result.options[index])
    }
    if (paginationType.value === 'cursor') {
      const next = result.nextCursor
      if (next !== null && !isString(next)) {
        throw new TypeError('Cursor remote options must resolve with nextCursor')
      }
      return { hasMore: next !== null, nextCursor: isString(next) ? next : null, options }
    }
    if (!isBoolean(result.hasMore)) {
      throw new TypeError('Paged remote options must resolve with hasMore')
    }
    return { hasMore: result.hasMore, nextCursor: null, options }
  }

  function retainSelected(candidates: readonly ResolvedFormOption[]) {
    const keys = new Set(selectedValues.value.map(formOptionKey))
    retained.value = mergeResolvedOptions(
      retained.value.filter((option) => containsAny(option, keys)),
      candidates.filter((option) => containsAny(option, keys)),
    )
  }

  async function loadPage(page: { index: number; cursor: string | null }) {
    const config = params.config.value
    if (!config) {
      return
    }
    const currentGeneration = generation.value
    const isFirstPage = page.index === 1 && page.cursor === null
    sourceFetching.value = true
    try {
      const result = await resolveRemoteResult(
        config.source({
          ...params.callbackParams.value,
          page: { cursor: page.cursor, index: page.index, size: pageSize.value },
          search: search.value,
        }),
      )
      if (currentGeneration !== generation.value) {
        return
      }
      const parsed = parsePage(result)
      loaded.value = isFirstPage
        ? parsed.options
        : mergeResolvedOptions(loaded.value, parsed.options)
      retainSelected(parsed.options)
      hasMore.value = parsed.hasMore
      nextCursor.value = parsed.nextCursor
      pageIndex.value = page.index
      cursor.value = page.cursor
      sourceError.value = null
      failedPage.value = null
    } catch (error) {
      if (currentGeneration !== generation.value) {
        return
      }
      sourceError.value = error
      failedPage.value = page
    } finally {
      if (currentGeneration === generation.value) {
        sourceFetching.value = false
      }
    }
  }

  function reload(options: { clearSearch: boolean }) {
    generation.value += 1
    sourceFetching.value = false
    loadingMore.value = false
    sourceError.value = null
    failedPage.value = null
    pageIndex.value = 1
    cursor.value = null
    nextCursor.value = null
    hasMore.value = false
    if (options.clearSearch) {
      searchInput.value = ''
      search.value = ''
    }
    if (!active.value || !canFetch.value) {
      loaded.value = []
      return Promise.resolve()
    }
    return loadPage({ cursor: null, index: 1 })
  }

  function activate() {
    if (!enabled.value || active.value) {
      return
    }
    active.value = true
    void reload({ clearSearch: false })
  }

  function setSearch(term: string) {
    if (!enabled.value) {
      return
    }
    activate()
    searchInput.value = term
  }

  async function loadMore() {
    if (!enabled.value || loadingMore.value || sourceFetching.value) {
      return
    }
    if (failedPage.value) {
      loadingMore.value = true
      try {
        await loadPage(failedPage.value)
      } finally {
        loadingMore.value = false
      }
      return
    }
    if (!hasMore.value) {
      return
    }
    loadingMore.value = true
    try {
      await loadPage(
        paginationType.value === 'cursor'
          ? { cursor: nextCursor.value, index: pageIndex.value + 1 }
          : { cursor: null, index: pageIndex.value + 1 },
      )
    } finally {
      loadingMore.value = false
    }
  }

  async function hydrateSelected(options: { reconcile: boolean }) {
    const values = options.reconcile ? selectedValues.value : missingSelected.value
    if (!values.length) {
      return
    }
    const request = resolveSelectedRequest(values)
    if (request === null) {
      return
    }
    selectedRun.value += 1
    const run = selectedRun.value
    const domain = selectionGeneration.value
    selectedFetching.value = true
    try {
      const result = await resolveRemoteResult(request)
      if (run !== selectedRun.value || domain !== selectionGeneration.value) {
        return
      }
      const resolved = normalizeOptionItems(
        Array.isArray(result) ? result : [],
        params.optionKeys.value,
      )
      for (const [index, option] of resolved.entries()) {
        rawOptions.set(formOptionKey(option.value), Array.isArray(result) ? result[index] : option)
      }
      const keys = new Set(values.map(formOptionKey))
      retained.value = mergeResolvedOptions(
        retained.value.filter((option) => !containsAny(option, keys)),
        resolved,
      )
      selectedError.value = null
      if (options.reconcile && params.config.value?.clearOnInvalid === true) {
        reconcileSelection(resolved)
      }
    } catch (error) {
      if (run === selectedRun.value && domain === selectionGeneration.value) {
        selectedError.value = error
      }
    } finally {
      if (run === selectedRun.value) {
        selectedFetching.value = false
      }
    }
  }

  function reconcileSelection(resolved: readonly ResolvedFormOption[]) {
    const valid = new Set(flatten(resolved).map((option) => formOptionKey(option.value)))
    const current = params.api.value.value.get()
    if (Array.isArray(current)) {
      const next = current.filter(
        (value) => isOptionValue(value) && valid.has(formOptionKey(value)),
      )
      if (next.length !== current.length) {
        params.api.value.value.set(next)
      }
      return
    }
    if (isOptionValue(current) && !valid.has(formOptionKey(current))) {
      params.api.value.value.set(params.multiple() ? [] : null)
    }
  }

  async function loadChildren(option: ResolvedFormOption) {
    const config = params.config.value
    if (!config) {
      return
    }
    const key = formOptionKey(option.value)
    const running = childRequests.get(key)
    if (running) {
      return running
    }
    const domain = selectionGeneration.value
    const request = loadChildrenPage(config, option, key, domain)
    childRequests.set(key, request)
    try {
      await request
    } finally {
      childRequests.delete(key)
    }
  }

  async function loadChildrenPage(
    config: FormRemoteOptionConfig<FormValue>,
    option: ResolvedFormOption,
    key: string,
    domain: number,
  ) {
    try {
      const result = await resolveRemoteResult(
        config.source({
          ...params.callbackParams.value,
          page: { cursor: null, index: 1, size: pageSize.value },
          parent: rawOptions.get(key) ?? option,
          search: '',
        }),
      )
      if (domain !== selectionGeneration.value) {
        return
      }
      const parsed = parsePage(result)
      loaded.value = replaceChildren(loaded.value, key, parsed.options)
      retained.value = replaceChildren(retained.value, key, parsed.options)
      retainSelected(loaded.value)
      sourceError.value = null
    } catch (error) {
      if (domain === selectionGeneration.value) {
        sourceError.value = error
      }
    }
  }

  async function refresh() {
    if (!enabled.value) {
      return
    }
    const tasks: Promise<void>[] = []
    if (active.value) {
      tasks.push(reload({ clearSearch: false }))
    }
    if (selectedValues.value.length) {
      tasks.push(hydrateSelected({ reconcile: false }))
    }
    await Promise.all(tasks)
  }

  async function retry() {
    if (!enabled.value) {
      return
    }
    const tasks: Promise<void>[] = []
    if (sourceError.value !== null) {
      tasks.push(failedPage.value ? loadMore() : reload({ clearSearch: false }))
    }
    if (selectedError.value !== null) {
      tasks.push(hydrateSelected({ reconcile: false }))
    }
    await Promise.all(tasks)
  }

  watchWithFilter(
    searchInput,
    (term) => {
      const next = term.trim()
      if (next === search.value) {
        return
      }
      search.value = next
      void reload({ clearSearch: false })
    },
    {
      eventFilter: debounceFilter(
        () => params.config.value?.search?.debounce ?? DEFAULT_SEARCH_DEBOUNCE,
      ),
    },
  )

  watch(
    selectedValues,
    (values) => {
      if (!enabled.value) {
        return
      }
      if (!values.length) {
        retained.value = []
        selectedError.value = null
        return
      }
      retainSelected(loaded.value)
      if (missingSelected.value.length) {
        void hydrateSelected({ reconcile: false })
      }
    },
    { immediate: true },
  )

  watch(
    () => {
      const config = params.config.value
      const { deps } = params.callbackParams.value
      if (!config?.refreshOn?.length || !isRecord(deps)) {
        return []
      }
      return config.refreshOn.map((alias) => deps[alias])
    },
    (next, previous) => {
      if (isUndefined(previous) || sameValues(next, previous)) {
        return
      }
      selectionGeneration.value += 1
      void reload({ clearSearch: true })
      void hydrateSelected({ reconcile: true })
    },
    { deep: true },
  )

  const pageIdentity = computed(() => {
    const config = params.config.value
    return config?.queryKeyFor
      ? hashKey(
          config.queryKeyFor({
            page: { cursor: null, index: 1, size: pageSize.value },
            search: '',
          }),
        )
      : null
  })
  const selectedIdentity = computed(() => {
    const config = params.config.value
    return config?.selectedQueryKeyFor ? hashKey(config.selectedQueryKeyFor({ values: [] })) : null
  })

  watch([pageIdentity, selectedIdentity], ([page, selected], [previousPage, previousSelected]) => {
    if (page === previousPage && selected === previousSelected) return
    selectionGeneration.value += 1
    if (page !== previousPage) void reload({ clearSearch: false })
    if (selectedValues.value.length) void hydrateSelected({ reconcile: true })
  })

  return {
    activate,
    error: errorValue,
    fetching,
    hasMore: computed(() => enabled.value && hasMore.value),
    items,
    loadChildren,
    loadMore,
    loadingMore: computed(() => loadingMore.value),
    pending,
    prefetchDistance,
    refresh,
    remote: enabled,
    retry,
    retryable,
    search: computed(() => searchInput.value),
    selectedItems,
    setSearch,
  }
}

function resolveQueryClient(): QueryClient | null {
  try {
    return useQueryClient()
  } catch {
    return null
  }
}

function isRuntimeQueryOptions(value: FormValue): value is FormRuntimeQueryOptions {
  return isRecord(value) && Array.isArray(Object.getOwnPropertyDescriptor(value, 'queryKey')?.value)
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}

function flatten(options: readonly ResolvedFormOption[]): readonly ResolvedFormOption[] {
  return options.flatMap((option) => [option, ...flatten(option.children ?? [])])
}

function containsAny(option: ResolvedFormOption, keys: ReadonlySet<string>): boolean {
  if (keys.has(formOptionKey(option.value))) {
    return true
  }
  return (option.children ?? []).some((child) => containsAny(child, keys))
}

function replaceChildren(
  options: readonly ResolvedFormOption[],
  key: string,
  children: readonly ResolvedFormOption[],
): readonly ResolvedFormOption[] {
  return options.map((option) => {
    if (formOptionKey(option.value) === key) {
      return { ...option, children }
    }
    if (!option.children) {
      return option
    }
    return { ...option, children: replaceChildren(option.children, key, children) }
  })
}

function sameValues(next: readonly FormValue[], previous: readonly FormValue[]) {
  return (
    next.length === previous.length &&
    next.every((value, index) => JSON.stringify(value) === JSON.stringify(previous[index]))
  )
}
