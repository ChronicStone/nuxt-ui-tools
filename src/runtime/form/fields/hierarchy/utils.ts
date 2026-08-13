import type { FormOptionValue } from '../../types'
import { formOptionKey, type ResolvedFormOption } from '../../utils/options'

export function resolveHierarchySelection(params: {
  next: readonly FormOptionValue[]
  intent?: FormOptionValue
  items: readonly ResolvedFormOption[]
  propagate: boolean
  bubble: boolean
}) {
  const values = new Map<string, FormOptionValue>()
  for (const value of params.next) values.set(formOptionKey(value), value)

  const intent = params.intent ? findOption(params.items, params.intent) : undefined
  if (params.propagate && intent) {
    const selecting = values.has(formOptionKey(intent.value))
    for (const descendant of flattenOptions(intent.children ?? [])) {
      const key = formOptionKey(descendant.value)
      if (selecting) values.set(key, descendant.value)
      else values.delete(key)
    }
  }

  if (params.bubble)
    for (const item of [...flattenOptions(params.items)].reverse()) {
      if (!item.children?.length) continue
      const key = formOptionKey(item.value)
      const allChildrenSelected = item.children.every((child) =>
        values.has(formOptionKey(child.value)),
      )
      if (allChildrenSelected) values.set(key, item.value)
      else values.delete(key)
    }

  return [...values.values()]
}

function findOption(items: readonly ResolvedFormOption[], value: FormOptionValue) {
  const key = formOptionKey(value)
  return flattenOptions(items).find((item) => formOptionKey(item.value) === key)
}

function flattenOptions(items: readonly ResolvedFormOption[]): readonly ResolvedFormOption[] {
  return items.flatMap((item) => [item, ...flattenOptions(item.children ?? [])])
}
