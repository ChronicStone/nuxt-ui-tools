import type { FormField, FormFieldCallbackParams } from '../types'
import { isFunction } from './predicate'
import { resolveFieldText } from './text'

/**
 * Whether the field's authored `disabled` callback holds. Engine-driven disabling (a pending form
 * action, options still loading) is separate: it explains itself, so it never carries a reason.
 */
export function isFieldDisabledByCallback(
  field: FormField,
  params: FormFieldCallbackParams,
): boolean {
  const disabled = Object.getOwnPropertyDescriptor(field, 'disabled')?.value
  return isFunction(disabled) ? disabled(params) === true : false
}

/**
 * The reason to show under a field while its `disabled` callback holds: the authored
 * `disabledReason` text, or nothing when the field is enabled or the author gave no reason.
 */
export function resolveFieldDisabledReason(
  field: FormField,
  params: FormFieldCallbackParams,
): string | undefined {
  if (!isFieldDisabledByCallback(field, params)) return undefined
  const reason = Object.getOwnPropertyDescriptor(field, 'disabledReason')?.value
  return resolveFieldText(reason, params) || undefined
}
