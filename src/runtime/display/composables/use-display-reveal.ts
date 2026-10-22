import { computed, ref } from 'vue'

/**
 * Folds a list after `max` items. Each `reveal()` shows `step` more, or everything left when
 * there is no step.
 */
export function useDisplayReveal<TItem>(params: {
  items: () => readonly TItem[]
  max: () => number | undefined
  step: () => number | undefined
}) {
  const extra = ref<number>(0)
  const limit = computed<number>(() => {
    const max = params.max()
    return max === undefined ? Number.POSITIVE_INFINITY : max + extra.value
  })
  const visible = computed(() => params.items().slice(0, limit.value))
  const hidden = computed<number>(() => Math.max(0, params.items().length - visible.value.length))
  const next = computed<number>(() => Math.min(hidden.value, params.step() ?? hidden.value))

  function reveal() {
    extra.value += next.value
  }

  return { hidden, next, reveal, visible }
}
