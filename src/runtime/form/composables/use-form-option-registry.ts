import { computed, shallowReactive } from 'vue'

import type { FormValue } from '../types'
import type { FormOptionRuntimeState } from '../types'
import type { ResolvedFormOption } from '../utils/options'
import { isString } from '../utils/predicate'

export function useFormOptionRegistry() {
  const states = shallowReactive<Record<string, FormOptionRuntimeState>>({})
  const emptyState = createEmptyOptionState()

  function register(path: readonly string[], state: FormOptionRuntimeState) {
    const key = optionStateKey(path)
    states[key] = state

    return () => {
      if (states[key] === state) delete states[key]
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
    register,
    get,
    refresh,
    refreshMany,
  }
}

function createEmptyOptionState(): FormOptionRuntimeState {
  return {
    items: computed<readonly ResolvedFormOption[]>(() => []),
    pending: computed<boolean>(() => false),
    fetching: computed<boolean>(() => false),
    loading: computed<boolean>(() => false),
    creating: computed<boolean>(() => false),
    creatable: computed<boolean>(() => false),
    createLabel: computed<string | undefined>(() => undefined),
    error: computed<FormValue | null>(() => null),
    disableOnLoading: computed<boolean>(() => false),
    refreshable: computed<boolean>(() => false),
    selectCreatedOption: computed<boolean>(() => true),
    refresh: async () => {},
    add: () => {},
    create: async () => null,
  }
}

function optionStateKey(path: readonly string[]) {
  return path.join('.')
}

function optionPathSegments(path: string | readonly string[]) {
  return isString(path) ? path.split('.').filter(Boolean) : path
}
