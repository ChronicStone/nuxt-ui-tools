import type { FormObject } from '../../types'
import { isString } from '../../utils/predicate'

/**
 * Attributes for the Nuxt UI group at `index` among the groups of one field. Every group carries
 * the control attributes of the field, but an `id` names a single element: the first group keeps
 * it, as the control the label points to, and each later group takes `<id>-group-<index>`. The other
 * attributes (`data-form-field`, `aria-label`) stay on every group, so focus moving from one
 * group to the next does not leave the field. Attributes without an `id` are returned as they
 * are: each Nuxt UI group then generates its own.
 */
export function choiceCardGroupAttrs<TAttrs extends FormObject>(
  attrs: TAttrs,
  index: number,
): TAttrs {
  const id = attrs.id
  if (index === 0 || !isString(id)) return attrs
  return { ...attrs, id: `${id}-group-${index}` }
}
