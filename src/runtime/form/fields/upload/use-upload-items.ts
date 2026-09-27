import { computed, inject, onScopeDispose, shallowRef, toRaw, watch } from 'vue'

import { filePreviewApiKey } from '../../../file-preview/composables/use-file-preview-api'
import type { FilePreviewFile } from '../../../file-preview/types'
import { useUiToolsLocale } from '../../../i18n/use-locale'
import { fileNameFromUrl, isImageType } from '../../../shared/utils/file'
import { useResolvedFieldProps } from '../../composables/use-field-control'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import type { FormValue } from '../../types'
import type { FormObject } from '../../types/utils'
import { isNumber, isObject, isString } from '../../utils/predicate'
import type { FormUploadField, FormUploadResolvedFile, FormUploadValue } from './types'

export type FormUploadItemStatus = 'stored' | 'queued' | 'uploading' | 'failed'

export interface FormUploadItem {
  key: string
  status: FormUploadItemStatus
  name: string
  description: string | null
  size: number | null
  type: string | null
  thumbnail: string | null
  openable: boolean
  resolving: boolean
  progress: number | null
  error: string | null
}

interface LocalUpload {
  key: string
  file: File
  status: Exclude<FormUploadItemStatus, 'stored'>
  progress: number | null
  error: string | null
  controller: AbortController | null
  thumbnail: string | null
}

interface ResolvedUpload {
  file: FormUploadResolvedFile
  pending: boolean
}

export function isUploadValue(value: FormValue): value is FormUploadValue {
  return isString(value) || (isObject(value) && value !== null && !Array.isArray(value))
}

export function defaultUploadResolve(value: FormUploadValue): FormUploadResolvedFile {
  if (isString(value)) return { name: fileNameFromUrl(value), url: value }

  const url = readString(value, 'url')
  return {
    name: readString(value, 'name') ?? (url ? fileNameFromUrl(url) : '—'),
    size: readNumber(value, 'size'),
    thumbnail: readString(value, 'thumbnail'),
    type: readString(value, 'type'),
    url,
  }
}

function readString(value: FormObject, key: string) {
  const entry = value[key]
  return isString(entry) && entry ? entry : null
}

function readNumber(value: FormObject, key: string) {
  const entry = value[key]
  return isNumber(entry) ? entry : null
}

function clampProgress(percent: number) {
  return Math.min(100, Math.max(0, percent))
}

function localItem(item: LocalUpload): FormUploadItem {
  return {
    description: null,
    error: item.error,
    key: item.key,
    name: item.file.name,
    openable: false,
    progress: item.progress,
    resolving: false,
    size: item.file.size,
    status: item.status,
    thumbnail: item.thumbnail,
    type: item.file.type || null,
  }
}

/**
 * Owns the upload lifecycle of one upload field: stored values resolved for display, files that
 * are queued, uploading, or failed, and the form value written when an upload succeeds.
 */
export function useUploadItems(field: () => FormUploadField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const fieldProps = useResolvedFieldProps(field, path)
  const { t } = useUiToolsLocale()
  const filePreview = inject(filePreviewApiKey, null)
  const local = shallowRef<readonly LocalUpload[]>([])
  const resolved = shallowRef<ReadonlyMap<FormUploadValue, ResolvedUpload>>(new Map())
  const tasks = new Map<string, Promise<void>>()
  const objectKeys = new WeakMap<FormObject, number>()
  /** Files uploaded in this session, whose name, size, type, and preview outlive the upload. */
  const uploaded = new Map<FormUploadValue, { file: File; thumbnail: string | null }>()
  let sequence = 0

  const multiple = computed<boolean>(() => fieldProps.value.multiple === true)
  const autoUpload = computed<boolean>(() => fieldProps.value.autoUpload !== false)
  const preview = computed<boolean>(() => fieldProps.value.preview !== false)
  const stored = computed<readonly FormUploadValue[]>(() => {
    const value = form.getValue(path())
    if (Array.isArray(value)) return value.filter(isUploadValue)
    return isUploadValue(value) ? [value] : []
  })
  const capacity = computed<number>(() => {
    if (!multiple.value) return 1
    const max = fieldProps.value.max
    return isNumber(max) ? Math.max(0, max - stored.value.length - local.value.length) : Infinity
  })
  const items = computed<readonly FormUploadItem[]>(() => [
    ...(multiple.value || local.value.length === 0 ? stored.value.map(storedItem) : []),
    ...local.value.map(localItem),
  ])
  const canSelect = computed<boolean>(() =>
    multiple.value ? capacity.value > 0 : items.value.length === 0,
  )
  const busy = computed<boolean>(() => local.value.some((item) => item.status === 'uploading'))

  function params() {
    return form.getFieldCallbackParams(path(), field())
  }

  function valueKey(value: FormUploadValue) {
    if (isString(value)) return value
    const known = objectKeys.get(value)
    if (known !== undefined) return `#${known}`
    sequence += 1
    objectKeys.set(value, sequence)
    return `#${sequence}`
  }

  function storedItem(value: FormUploadValue, index: number): FormUploadItem {
    const state = resolved.value.get(value)
    const file = state?.file ?? defaultUploadResolve(value)
    const session = uploaded.get(toRaw(value))
    const type = file.type ?? session?.file.type ?? null
    const thumbnail =
      file.thumbnail ?? session?.thumbnail ?? (isImageType(type) ? (file.url ?? null) : null)
    return {
      description: file.description ?? null,
      error: null,
      key: `stored:${index}:${valueKey(value)}`,
      name: file.name || session?.file.name || '',
      openable:
        file.openable ??
        Boolean(field().upload.open ?? file.url ?? (filePreview?.mounted.value ? session : null)),
      progress: null,
      resolving: !session && (!state || state.pending),
      size: file.size ?? session?.file.size ?? null,
      status: 'stored',
      thumbnail: preview.value ? thumbnail : null,
      type,
    }
  }

  async function resolveValue(value: FormUploadValue) {
    const hook = field().upload.resolve
    let file = defaultUploadResolve(value)
    if (hook) {
      try {
        file = (await hook({ ...params(), value })) ?? file
      } catch {
        file = defaultUploadResolve(value)
      }
    }
    if (resolved.value.has(value))
      resolved.value = new Map(resolved.value).set(value, { file, pending: false })
  }

  watch(
    stored,
    (values) => {
      const next = new Map<FormUploadValue, ResolvedUpload>()
      for (const value of values) {
        const known = resolved.value.get(value)
        if (known) {
          next.set(value, known)
          continue
        }
        next.set(value, { file: defaultUploadResolve(value), pending: true })
      }
      resolved.value = next
      for (const value of values) if (resolved.value.get(value)?.pending) void resolveValue(value)
    },
    { immediate: true },
  )

  function patch(key: string, changes: Partial<LocalUpload>) {
    local.value = local.value.map((item) => (item.key === key ? { ...item, ...changes } : item))
  }

  function drop(key: string, options: { keepPreview?: boolean } = {}) {
    const item = local.value.find((entry) => entry.key === key)
    if (!item) return
    item.controller?.abort()
    if (item.thumbnail && !options.keepPreview) URL.revokeObjectURL(item.thumbnail)
    local.value = local.value.filter((entry) => entry.key !== key)
  }

  function forget(value: FormUploadValue) {
    const session = uploaded.get(toRaw(value))
    if (session?.thumbnail) URL.revokeObjectURL(session.thumbnail)
    uploaded.delete(toRaw(value))
  }

  function select(files: readonly File[]) {
    const accepted = files.slice(0, capacity.value)
    if (accepted.length === 0) return
    if (!multiple.value) for (const item of local.value) drop(item.key)

    const added = accepted.map<LocalUpload>((file) => {
      sequence += 1
      return {
        controller: null,
        error: null,
        file,
        key: `local:${sequence}`,
        progress: null,
        status: 'queued',
        thumbnail: preview.value && isImageType(file.type) ? URL.createObjectURL(file) : null,
      }
    })
    local.value = [...local.value, ...added]
    if (autoUpload.value) for (const item of added) void run(item.key)
  }

  async function commit(key: string, result: FormUploadValue | readonly FormUploadValue[] | null) {
    const value = Array.isArray(result) ? (result[0] ?? null) : result
    if (value === null || !isUploadValue(value)) {
      patch(key, { controller: null, error: t('form.fields.upload.failed'), status: 'failed' })
      return
    }

    const replaced = multiple.value ? [] : stored.value
    const item = local.value.find((entry) => entry.key === key)
    if (item) uploaded.set(toRaw(value), { file: item.file, thumbnail: item.thumbnail })
    form.setValue(path(), multiple.value ? [...stored.value, value] : value)
    drop(key, { keepPreview: true })
    for (const previous of replaced) forget(previous)
    for (const previous of replaced)
      await field().upload.onDelete?.({ ...params(), value: previous })
  }

  async function upload(item: LocalUpload, controller: AbortController) {
    try {
      const result = await field().upload.handler({
        ...params(),
        files: [item.file],
        onProgress: (percent) => {
          if (!controller.signal.aborted) patch(item.key, { progress: clampProgress(percent) })
        },
        signal: controller.signal,
      })
      if (!controller.signal.aborted) await commit(item.key, result)
    } catch (error) {
      if (controller.signal.aborted) return
      patch(item.key, {
        controller: null,
        error:
          error instanceof Error && error.message ? error.message : t('form.fields.upload.failed'),
        progress: null,
        status: 'failed',
      })
    } finally {
      tasks.delete(item.key)
    }
  }

  function run(key: string) {
    const item = local.value.find((entry) => entry.key === key)
    if (!item || item.status === 'uploading') return tasks.get(key) ?? Promise.resolve()

    const controller = new AbortController()
    patch(key, { controller, error: null, progress: null, status: 'uploading' })
    const task = upload(item, controller)
    tasks.set(key, task)
    return task
  }

  function localKeys(status: LocalUpload['status']) {
    return local.value.filter((item) => item.status === status).map((item) => item.key)
  }

  async function remove(key: string) {
    if (key.startsWith('local:')) return drop(key)

    const index = items.value.findIndex((item) => item.key === key)
    const value = stored.value[index]
    if (value === undefined) return
    await field().upload.onDelete?.({ ...params(), value })
    form.setValue(
      path(),
      multiple.value ? stored.value.filter((_entry, position) => position !== index) : null,
    )
    forget(value)
  }

  async function open(key: string) {
    const index = items.value.findIndex((item) => item.key === key)
    const value = stored.value[index]
    if (value === undefined) return
    const file = resolved.value.get(value)?.file ?? defaultUploadResolve(value)
    const hook = field().upload.open
    if (hook) return await hook({ ...params(), file, value })
    if (filePreview?.mounted.value && openPreview(value)) return
    if (file.url) window.open(file.url, '_blank', 'noopener')
  }

  /** Previews the field's files as a gallery, starting at `value`. Unsaved uploads need no request. */
  function openPreview(value: FormUploadValue) {
    const entries = stored.value.flatMap((entry) => {
      const file = resolved.value.get(entry)?.file ?? defaultUploadResolve(entry)
      const session = uploaded.get(toRaw(entry))
      const src = session?.file ?? file.url
      if (!src) return []
      const described: FilePreviewFile = {
        mime: file.type ?? session?.file.type ?? undefined,
        name: file.name || session?.file.name || undefined,
        size: file.size ?? session?.file.size ?? undefined,
        src,
        thumbnail: file.thumbnail ?? session?.thumbnail ?? undefined,
      }
      return [{ described, entry }]
    })
    const index = entries.findIndex((candidate) => candidate.entry === value)
    if (index === -1 || !filePreview) return false
    filePreview.open(
      entries.map((candidate) => candidate.described),
      { index },
    )
    return true
  }

  async function removeValue(value?: FormValue) {
    for (const item of local.value) drop(item.key)
    if (value === undefined) {
      for (const entry of stored.value)
        await field().upload.onDelete?.({ ...params(), value: entry })
      form.setValue(path(), multiple.value ? [] : null)
      return
    }
    await field().upload.onDelete?.({ ...params(), value })
    form.setValue(path(), multiple.value ? stored.value.filter((entry) => entry !== value) : null)
  }

  const runtime = {
    cancel: async () => {
      for (const key of localKeys('uploading')) drop(key)
    },
    pending: () => local.value.length > 0,
    remove: removeValue,
    retry: async () => {
      await Promise.all(localKeys('failed').map(run))
    },
    settle: async () => {
      await Promise.allSettled(tasks.values())
    },
    start: async () => {
      await Promise.all(localKeys('queued').map(run))
    },
  }

  onScopeDispose(() => {
    for (const item of local.value) {
      item.controller?.abort()
      if (item.thumbnail) URL.revokeObjectURL(item.thumbnail)
    }
    for (const value of uploaded.keys()) forget(value)
  })

  return {
    busy,
    canSelect,
    cancel: drop,
    items,
    multiple,
    open,
    remove,
    retry: run,
    runtime,
    select,
    start: run,
  }
}
