import { shallowReactive } from 'vue'

import type { FormUploadRuntimeState } from '../types'

export function useFormUploadRegistry() {
  const states = shallowReactive<Record<string, FormUploadRuntimeState>>({})

  function register(path: readonly string[], state: FormUploadRuntimeState) {
    const key = path.join('.')
    states[key] = state
    return () => {
      if (states[key] === state) delete states[key]
    }
  }

  function get(path: readonly string[]) {
    return states[path.join('.')]
  }

  return { register, get }
}
