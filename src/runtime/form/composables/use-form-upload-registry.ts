import { shallowReactive } from 'vue'

import type { FormUploadRuntimeState } from '../types'

export function useFormUploadRegistry() {
  const states = shallowReactive<
    Record<string, { path: readonly string[]; state: FormUploadRuntimeState }>
  >({})

  function register(path: readonly string[], state: FormUploadRuntimeState) {
    const key = path.join('.')
    const entry = { path, state }
    states[key] = entry
    return () => {
      if (states[key] === entry) delete states[key]
    }
  }

  function get(path: readonly string[]) {
    return states[path.join('.')]?.state
  }

  async function settle() {
    await Promise.all(Object.values(states).map((entry) => entry.state.settle()))
  }

  function pendingPaths() {
    return Object.values(states)
      .filter((entry) => entry.state.pending())
      .map((entry) => entry.path)
  }

  return { get, pendingPaths, register, settle }
}
