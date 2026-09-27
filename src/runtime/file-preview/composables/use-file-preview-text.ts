import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import { formatFileSize } from '../../shared/utils/file'
import type { FilePreviewRendererProps } from '../types'

/** Text previews read at most this many bytes, then cancel the read. */
export const FILE_PREVIEW_TEXT_LIMIT = 512 * 1024

type FilePreviewTextStatus = 'loading' | 'ready' | 'error'

async function readBlob(blob: Blob) {
  return {
    text: await blob.slice(0, FILE_PREVIEW_TEXT_LIMIT).text(),
    total: blob.size,
    truncated: blob.size > FILE_PREVIEW_TEXT_LIMIT,
  }
}

async function readUrl(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim())
  const header = Number(response.headers.get('content-length'))
  const total = Number.isFinite(header) && header > 0 ? header : null
  if (!response.body) {
    const text = await response.text()
    return {
      text: text.slice(0, FILE_PREVIEW_TEXT_LIMIT),
      total,
      truncated: text.length > FILE_PREVIEW_TEXT_LIMIT,
    }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let received = 0
  for (;;) {
    const chunk = await reader.read()
    if (chunk.done) break
    const room = FILE_PREVIEW_TEXT_LIMIT - received
    received += chunk.value.byteLength
    if (chunk.value.byteLength > room) {
      text += decoder.decode(chunk.value.subarray(0, room))
      await reader.cancel()
      return { text, total, truncated: true }
    }
    text += decoder.decode(chunk.value, { stream: true })
  }
  return { text: text + decoder.decode(), total: total ?? received, truncated: false }
}

/** Reads a text file for a renderer: from its bytes when it is a `Blob`, otherwise with `fetch`. */
export function useFilePreviewText(props: Pick<FilePreviewRendererProps, 'url' | 'blob'>) {
  const { code, t } = useUiToolsLocale()
  const text = ref<string>('')
  const truncated = ref<boolean>(false)
  const total = ref<number | null>(null)
  const status = ref<FilePreviewTextStatus>('loading')
  const error = shallowRef<Error | null>(null)
  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    const current = new AbortController()
    controller = current
    status.value = 'loading'
    error.value = null
    try {
      const result = props.blob
        ? await readBlob(props.blob)
        : await readUrl(props.url, current.signal)
      if (current.signal.aborted) return
      text.value = result.text.replace(/^﻿/u, '')
      truncated.value = result.truncated
      total.value = result.total
      status.value = 'ready'
    } catch (cause) {
      if (current.signal.aborted) return
      error.value = cause instanceof Error ? cause : new Error(String(cause))
      status.value = 'error'
    }
  }

  watch(() => [props.url, props.blob], load, { immediate: true })
  onScopeDispose(() => controller?.abort())

  /** "Showing the first 512 kB of 14 MB." when the file was cut. */
  const notice = computed(() =>
    truncated.value
      ? t('filePreview.truncated', {
          size: formatFileSize(FILE_PREVIEW_TEXT_LIMIT, code.value),
          total: total.value === null ? '—' : formatFileSize(total.value, code.value),
        })
      : null,
  )

  return { error, notice, status, text, total, truncated }
}
