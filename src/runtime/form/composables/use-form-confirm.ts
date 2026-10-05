import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import type { FormConfirmHandler, FormConfirmRequest } from '../types'

const formConfirmKey: InjectionKey<FormConfirmHandler> = Symbol('nuxt-ui-tools-form-confirm')

export function provideFormConfirm(handler: FormConfirmHandler) {
  provide(formConfirmKey, handler)
}

/** Asks the app's confirm handler, or the native dialog when no provider supplies one. */
export function useFormConfirm() {
  const handler = inject(formConfirmKey, nativeConfirm)

  return async function confirm(request: FormConfirmRequest) {
    return (await handler(request)) === true
  }
}

export function nativeConfirm(request: FormConfirmRequest) {
  // oxlint-disable-next-line no-alert -- fallback when the app provides no confirm handler
  return window.confirm(request.message)
}
