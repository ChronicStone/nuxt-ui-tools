import { nextTick, ref } from 'vue'

import type { FormFocusRequest, FormValidationError } from '../types'
import {
  focusFirstInvalidFormField,
  focusFormField,
  focusFormFieldElement,
  normalizeFormFocusPath,
} from '../utils/focus'

export function useFormFocus(params: { getErrors: () => readonly FormValidationError[] }) {
  const fieldElements = new Map<string, HTMLElement>()
  const request = ref<FormFocusRequest | null>(null)
  let sequence = 0

  function registerField(path: string | readonly string[], element: HTMLElement) {
    const key = normalizeFormFocusPath(path)
    fieldElements.set(key, element)

    return () => {
      if (fieldElements.get(key) === element) fieldElements.delete(key)
    }
  }

  async function focusField(path: string | readonly string[]) {
    await nextTick()
    const key = normalizeFormFocusPath(path)
    request.value = { path: key, sequence: ++sequence }
    await nextTick()
    const focused =
      (await focusFormFieldElement(fieldElements.get(key) ?? null)) || (await focusFormField(path))
    if (focused) return true

    await waitForFocusRequest()
    const element = fieldElements.get(key)
    return Boolean(document.activeElement && element?.contains(document.activeElement))
  }

  async function focusFirstInvalid(errors = params.getErrors()) {
    await nextTick()
    for (const error of errors) {
      const focused = await focusField(error.path)
      if (focused) return true
    }

    return focusFirstInvalidFormField(errors)
  }

  return {
    request,
    registerField,
    focusField,
    focusFirstInvalid,
  }
}

function waitForFocusRequest() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 160))
}
