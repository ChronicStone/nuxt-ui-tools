import { computed, shallowReactive } from 'vue'

import type { FormOptionRuntimeState } from '../types'
import type { ResolvedFormOption } from '../utils/options'

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

  return {
    register,
    get,
  }
}

function createEmptyOptionState(): FormOptionRuntimeState {
  return {
    items: computed<readonly ResolvedFormOption[]>(() => []),
    pending: computed<boolean>(() => false),
    fetching: computed<boolean>(() => false),
    loading: computed<boolean>(() => false),
    error: computed<unknown | null>(() => null),
    disableOnLoading: computed<boolean>(() => false),
    refresh: async () => {},
    add: () => {},
    create: async () => null,
  }
}

function optionStateKey(path: readonly string[]) {
  return path.join('.')
}
