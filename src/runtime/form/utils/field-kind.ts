import type { FormFieldKindDefinition } from '../types'

/**
 * Defines a form field kind and preserves its literal type for the registry.
 *
 * @example
 * ```ts
 * export const textFieldKind = defineFormFieldKind({
 *   type: 'text',
 *   state: 'stateful',
 *   ui: { label: true, description: true, hint: true },
 *   layout: { item: true },
 *   validation: true,
 *   transform: true,
 * })
 * ```
 */
export function defineFormFieldKind<const TDefinition extends FormFieldKindDefinition>(
  definition: TDefinition,
) {
  return definition
}
