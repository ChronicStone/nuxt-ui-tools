import { onScopeDispose, ref } from 'vue'

/** Delay between the last edit of a typed filter value and its commit to the query. */
export const FILTER_COMMIT_DELAY = 350

export interface UseDeferredCommitParams {
  commit: () => void
  delay?: number
  /** Commits a pending value when the owner unmounts, for editors embedded in a picker or sheet. */
  flushOnDispose?: boolean
}

/**
 * Commits a typed value after a short pause, on demand (`flush`), or not at all (`cancel`).
 * Editors schedule a commit on every edit, flush it when they close, and cancel it once the value
 * is committed by another path (Enter, clear). Embedded editors unmount with their picker or sheet
 * instead of closing, so they flush on dispose.
 */
export function useDeferredCommit(params: UseDeferredCommitParams) {
  const pending = ref<boolean>(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function cancel() {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    pending.value = false
  }

  function schedule() {
    cancel()
    pending.value = true
    timer = setTimeout(() => {
      timer = undefined
      pending.value = false
      params.commit()
    }, params.delay ?? FILTER_COMMIT_DELAY)
  }

  function flush() {
    if (!pending.value) {
      return
    }
    cancel()
    params.commit()
  }

  onScopeDispose(() => (params.flushOnDispose ? flush() : cancel()))

  return { cancel, flush, pending, schedule }
}
