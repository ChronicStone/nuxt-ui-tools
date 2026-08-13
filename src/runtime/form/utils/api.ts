import type { FormApi, FormRuntime } from '../types'

export function createPublicFormApi(runtime: FormRuntime): FormApi {
  return {
    get: runtime.getValue,
    set: runtime.setValue,
    validate: runtime.validate,
    focus: runtime.focusField,
    submit: async () => {
      await runtime.submit()
    },
    reset: runtime.reset,
  }
}
