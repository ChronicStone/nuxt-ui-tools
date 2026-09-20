import { computed, ref, shallowReactive } from 'vue'

import type { FormValue, FormOptionRuntimeState } from '../types'
import type { ResolvedFormOption } from '../utils/options'
import { isString } from '../utils/predicate'

const emptyLabel = ref<string | undefined>()

export function useFormOptionRegistry() {
  const states = shallowReactive<Record<string, FormOptionRuntimeState>>({})
  const emptyState = createEmptyOptionState()

  function register(path: readonly string[], state: FormOptionRuntimeState) {
    const key = optionStateKey(path)
    states[key] = state

    return () => {
      if (states[key] === state) {
        delete states[key]
      }
    }
  }

  function get(path: readonly string[]) {
    return states[optionStateKey(path)] ?? emptyState
  }

  async function refresh(path: string | readonly string[]) {
    await get(optionPathSegments(path)).refresh()
  }

  async function refreshMany(paths: readonly (string | readonly string[])[]) {
    await Promise.all(paths.map((path) => refresh(path)))
  }

  return {
    get,
    refresh,
    refreshMany,
    register,
  }
}

function createEmptyOptionState(): FormOptionRuntimeState {
  return {
    activate: () => {},
    add: () => {},
    creatable: computed<boolean>(() => false),
    create: async () => null,
    createLabel: computed<string | undefined>(() => emptyLabel.value),
    creating: computed<boolean>(() => false),
    disableOnLoading: computed<boolean>(() => false),
    error: computed<FormValue | null>(() => null),
    fetching: computed<boolean>(() => false),
    hasMore: computed<boolean>(() => false),
    items: computed<readonly ResolvedFormOption[]>(() => []),
    loadChildren: () => Promise.resolve(),
    loadMore: () => Promise.resolve(),
    loading: computed<boolean>(() => false),
    loadingMore: computed<boolean>(() => false),
    pending: computed<boolean>(() => false),
    prefetchDistance: computed<number | 'viewport'>(() => 'viewport'),
    refresh: async () => {},
    refreshable: computed<boolean>(() => false),
    remote: computed<boolean>(() => false),
    retry: () => Promise.resolve(),
    retryable: computed<boolean>(() => false),
    search: computed<string>(() => ''),
    selectCreatedOption: computed<boolean>(() => true),
    selectedItems: computed<readonly ResolvedFormOption[]>(() => []),
    setSearch: () => {},
  }
}

function optionStateKey(path: readonly string[]) {
  return path.join('.')
}

function optionPathSegments(path: string | readonly string[]) {
  return isString(path) ? path.split('.').filter(Boolean) : path
}
