import type { FormApi, FormRuntime } from '../types'
import { pathSegments } from './path'

export function createPublicFormApi(runtime: FormRuntime): FormApi {
  return {
    get: runtime.getValue,
    set: runtime.setValue,
    validate: runtime.validate,
    setError: (path, message) => runtime.setError(pathSegments(path), message),
    clearError: (path) => runtime.clearError(path ? pathSegments(path) : undefined),
    focus: runtime.focusField,
    submit: async () => {
      await runtime.submit()
    },
    reset: runtime.reset,
  }
}
