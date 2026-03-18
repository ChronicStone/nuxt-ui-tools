import { type MaybeRefOrGetter, ref, toValue } from 'vue'

interface RangeSelectEntry {
  value: unknown
  selected: boolean
}

interface UseRangeSelectOptions<TEntry extends RangeSelectEntry> {
  entries: MaybeRefOrGetter<TEntry[]>
  onToggle: (value: TEntry['value']) => void
}

export function useRangeSelect<TEntry extends RangeSelectEntry>(
  options: UseRangeSelectOptions<TEntry>,
) {
  const anchorIndex = ref<number | null>(null)
  const anchorAction = ref<'select' | 'deselect' | null>(null)

  function handleClick(event: MouseEvent, entry: TEntry, index: number) {
    const entries = toValue(options.entries)
    if (event.shiftKey && anchorIndex.value !== null && anchorAction.value !== null) {
      const start = Math.min(anchorIndex.value, index)
      const end = Math.max(anchorIndex.value, index)
      const shouldSelect = anchorAction.value === 'select'
      for (let i = start; i <= end; i++) {
        const e = entries[i]
        if (e && e.selected !== shouldSelect) options.onToggle(e.value)
      }
      anchorIndex.value = index
    } else {
      anchorAction.value = entry.selected ? 'deselect' : 'select'
      anchorIndex.value = index
      options.onToggle(entry.value)
    }
  }

  function reset() {
    anchorIndex.value = null
    anchorAction.value = null
  }

  return { handleClick, reset }
}
