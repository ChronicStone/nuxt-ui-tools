import type { FormValidationError } from '../types'
import { isString } from './predicate'

const focusableSelector = [
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function normalizeFormFocusPath(path: string | readonly string[]) {
  return isString(path) ? path : path.join('.')
}

export async function focusFormField(path: string | readonly string[]) {
  if (!import.meta.client) {
    return false
  }

  const fieldElement = findFieldElement(normalizeFormFocusPath(path))
  return focusFormFieldElement(fieldElement)
}

export async function focusFormFieldElement(fieldElement: HTMLElement | null) {
  const focusableElement = fieldElement ? findFocusableElement(fieldElement) : null
  if (!fieldElement || !focusableElement) {
    return false
  }

  focusableElement.focus({ preventScroll: true })
  fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  await waitForFocusSettle()

  return document.activeElement === focusableElement
}

export async function focusNextFormField(formElement: HTMLFormElement, currentField: HTMLElement) {
  const fields = [...formElement.querySelectorAll<HTMLElement>('[data-form-field]')]
  const currentIndex = fields.indexOf(currentField)
  if (currentIndex === -1) {
    return false
  }

  for (const fieldElement of fields.slice(currentIndex + 1)) {
    const control = findFocusableElement(fieldElement)
    if (control?.closest('[data-form-field]') !== fieldElement) {
      continue
    }
    if (await focusFormFieldElement(control)) {
      return true
    }
  }

  return false
}

export async function focusFirstInvalidFormField(errors: readonly FormValidationError[]) {
  for (const error of errors) {
    const focused = await focusFormField(error.path)
    if (focused) {
      return true
    }
  }

  return false
}

function findFieldElement(path: string) {
  return (
    [...document.querySelectorAll<HTMLElement>('[data-form-field]')].find(
      (element) => element.dataset.formField === path,
    ) ?? null
  )
}

function findFocusableElement(element: HTMLElement) {
  if (element.matches(focusableSelector) && isFocusableElement(element)) {
    return element
  }

  return (
    [...element.querySelectorAll<HTMLElement>(focusableSelector)].find(isFocusableElement) ?? null
  )
}

function isFocusableElement(element: HTMLElement) {
  if (element.hasAttribute('disabled')) {
    return false
  }
  if (element.getAttribute('aria-hidden') === 'true') {
    return false
  }
  return true
}

function waitForFocusSettle() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 120))
}
