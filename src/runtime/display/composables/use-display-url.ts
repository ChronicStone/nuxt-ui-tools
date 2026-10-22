import { ref, shallowRef, watch } from 'vue'

import { isString } from '../../shared/utils/predicate'
import type { DisplayUrl } from '../types'

/**
 * Runs link actions (open, download) one at a time per key: `pending` names the running one for
 * its button's loading state, and `failed` keeps the last failure with a way to try it again.
 */
export function useDisplayUrlActions() {
  const pending = ref<string | null>(null)
  const failed = shallowRef<{ key: string; retry: () => void } | null>(null)

  async function run(key: string, action: () => Promise<void>) {
    if (pending.value === key) return
    pending.value = key
    failed.value = null
    try {
      await action()
    } catch {
      failed.value = { key, retry: () => void run(key, action) }
    } finally {
      if (pending.value === key) pending.value = null
    }
  }

  return { failed, pending, run }
}

/**
 * The address of a media file to show right away: a string as is, a function resolved when the
 * block mounts and again when it changes. An older call never overwrites a newer one.
 */
export function useResolvedDisplayUrl(source: () => DisplayUrl | undefined) {
  const url = ref<string | undefined>(undefined)
  const pending = ref<boolean>(false)
  const failed = ref<boolean>(false)
  let run = 0

  async function resolve(current: DisplayUrl | undefined) {
    run += 1
    const own = run
    failed.value = false
    if (current === undefined || isString(current)) {
      url.value = current
      pending.value = false
      return
    }
    pending.value = true
    try {
      const resolved = await current()
      if (own === run) url.value = resolved
    } catch {
      if (own === run) failed.value = true
    } finally {
      if (own === run) pending.value = false
    }
  }

  watch(source, (current) => void resolve(current), { immediate: true })

  return { failed, pending, retry: () => void resolve(source()), url }
}
