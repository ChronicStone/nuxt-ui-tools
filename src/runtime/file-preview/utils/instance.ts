import { readonly, ref, shallowRef } from 'vue'

import type {
  FilePreviewHandle,
  FilePreviewInput,
  FilePreviewInstance,
  FilePreviewItem,
  FilePreviewOptions,
  FilePreviewRendererDefinition,
} from '../types'
import { normalizeFilePreviewItems } from './files'

function clamp(index: number, length: number) {
  return Math.min(Math.max(0, Math.trunc(index)), Math.max(0, length - 1))
}

/** Creates the state of one open preview: its files, position, open flag, and public handle. */
export function createFilePreviewInstance(params: {
  id: string
  input: FilePreviewInput | readonly FilePreviewInput[]
  options: FilePreviewOptions
  renderers: () => readonly FilePreviewRendererDefinition[]
  onDispose: (id: string) => void
}): FilePreviewInstance {
  const { id, options } = params
  const files = shallowRef<readonly FilePreviewItem[]>(
    normalizeFilePreviewItems(params.input, params.renderers()),
  )
  const index = ref<number>(clamp(options.index ?? 0, files.value.length))
  const open = ref<boolean>(true)
  let settle: (() => void) | null = null
  let disposed = false
  const closed = new Promise<void>((resolve) => {
    settle = resolve
  })

  function goTo(target: number) {
    const count = files.value.length
    if (count === 0) return
    const next = options.loop
      ? ((Math.trunc(target) % count) + count) % count
      : clamp(target, count)
    if (next === index.value) return
    index.value = next
    const item = files.value[next]
    if (item) options.onChange?.(item.file, next)
  }

  const handle: FilePreviewHandle = {
    close: () => {
      open.value = false
    },
    closed,
    goTo,
    id,
    index: readonly(index),
    next: () => goTo(index.value + 1),
    previous: () => goTo(index.value - 1),
    update: (input) => {
      files.value = normalizeFilePreviewItems(input, params.renderers())
      index.value = clamp(index.value, files.value.length)
    },
  }

  return {
    dispose: () => {
      if (disposed) return
      disposed = true
      params.onDispose(id)
      settle?.()
      options.onClose?.()
    },
    files,
    handle,
    id,
    index,
    open,
    options,
  }
}
