import { useObjectUrl } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'

import { isFunction, isString } from '../../shared/utils/predicate'
import type { FilePreviewItem, FilePreviewSourceValue } from '../types'

type FilePreviewSourceStatus = 'loading' | 'ready' | 'error'

/** Sources resolved by a function, kept per file so reopening or re-rendering skips the request. */
const resolved = new WeakMap<FilePreviewItem, FilePreviewSourceValue>()

/**
 * Resolves the shown file's source. URLs are used as they are, `Blob` sources become an object URL
 * that is revoked when the file changes, and source functions run once per file for the life of
 * the preview, then again on `retry()`.
 */
export function useFilePreviewSource(item: () => FilePreviewItem | null) {
  const value = shallowRef<FilePreviewSourceValue | null>(null)
  const status = ref<FilePreviewSourceStatus>('loading')
  const error = shallowRef<Error | null>(null)
  const blob = computed(() => (value.value instanceof Blob ? value.value : null))
  const objectUrl = useObjectUrl(blob)
  const url = computed(() => (isString(value.value) ? value.value : (objectUrl.value ?? null)))
  let attempt = 0

  function settle(next: FilePreviewSourceValue) {
    value.value = next
    error.value = null
    status.value = 'ready'
  }

  async function resolve(options: { force: boolean }) {
    attempt += 1
    const current = attempt
    const file = item()
    if (!file) return
    const src = file.file.src
    if (isString(src) || src instanceof Blob) return settle(src)

    const known = options.force ? undefined : resolved.get(file)
    if (known !== undefined) return settle(known)

    value.value = null
    error.value = null
    status.value = 'loading'
    try {
      const next = await src()
      if (current !== attempt) return
      resolved.set(file, next)
      settle(next)
    } catch (cause) {
      if (current !== attempt) return
      error.value = cause instanceof Error ? cause : new Error(String(cause))
      status.value = 'error'
    }
  }

  watch(item, () => resolve({ force: false }), { immediate: true })

  return {
    blob,
    error,
    /** Whether `retry()` can fetch the source again, which only a source function can. */
    retryable: computed(() => isFunction(item()?.file.src)),
    retry: () => resolve({ force: true }),
    status,
    url,
  }
}
