import type { FormApi, FormRuntime } from '../types'
import { pathSegments } from './path'

export function createPublicFormApi(runtime: FormRuntime): FormApi {
  return {
    clearError: (path) => runtime.clearError(path ? pathSegments(path) : undefined),
    focus: runtime.focusField,
    get: runtime.getValue,
    reset: runtime.reset,
    set: runtime.setValue,
    setError: (path, message) => runtime.setError(pathSegments(path), message),
    submit: async () => {
      await runtime.submit()
    },
    validate: runtime.validate,
  }
}
