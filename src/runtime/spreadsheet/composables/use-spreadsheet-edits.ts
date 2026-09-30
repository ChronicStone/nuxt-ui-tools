import { computed, shallowRef } from 'vue'

/**
 * Cell edits made in review, by row and field. An edit replaces the cell text and goes through the
 * same parsing, options, and rules as the file.
 */
export function useSpreadsheetEdits() {
  const edits = shallowRef<ReadonlyMap<number, Readonly<Record<string, string>>>>(new Map())

  function set(index: number, field: string, text: string) {
    const next = new Map(edits.value)
    next.set(index, { ...next.get(index), [field]: text })
    edits.value = next
  }

  function revert(index: number, field: string) {
    const current = edits.value.get(index)
    if (!current || !(field in current)) return
    const next = new Map(edits.value)
    const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== field))
    if (Object.keys(rest).length) next.set(index, rest)
    else next.delete(index)
    edits.value = next
  }

  function clear() {
    edits.value = new Map()
  }

  const count = computed(() =>
    [...edits.value.values()].reduce((total, fields) => total + Object.keys(fields).length, 0),
  )

  return { clear, count, edits, revert, set }
}
