import { computed, inject, provide, ref, shallowRef } from 'vue'
import type { InjectionKey } from 'vue'

import type { FilePreviewApi, FilePreviewInstance, FilePreviewRendererDefinition } from '../types'
import { createFilePreviewInstance } from '../utils/instance'
import { mergeFilePreviewRenderers } from '../utils/renderers'

export const filePreviewApiKey: InjectionKey<FilePreviewApi> = Symbol(
  'nuxt-ui-tools-file-preview-api',
)

/**
 * Creates a file preview API. Inside a Nuxt app the module already creates one for the whole app,
 * exposed as `useNuxtApp().$filePreview` and `useFilePreview()`.
 */
export function createFilePreviewApi(): FilePreviewApi {
  const instances = shallowRef<readonly FilePreviewInstance[]>([])
  const custom = shallowRef<readonly FilePreviewRendererDefinition[]>([])
  const providers = ref<number>(0)
  const renderers = computed(() => mergeFilePreviewRenderers(custom.value))
  let sequence = 0

  function find(id: string) {
    return instances.value.find((instance) => instance.id === id) ?? null
  }

  function remove(id: string) {
    instances.value = instances.value.filter((instance) => instance.id !== id)
  }

  const open: FilePreviewApi['open'] = (input, options = {}) => {
    const existing = options.id ? find(options.id) : null
    if (existing) {
      existing.handle.update(input)
      if (options.index !== undefined) existing.handle.goTo(options.index)
      existing.open.value = true
      return existing.handle
    }

    sequence += 1
    const instance = createFilePreviewInstance({
      id: options.id ?? `file-preview-${sequence}`,
      input,
      onDispose: remove,
      options,
      renderers: () => renderers.value,
    })
    instances.value = [...instances.value, instance]
    return instance.handle
  }

  function close(id?: string) {
    const instance = id ? find(id) : (instances.value.at(-1) ?? null)
    if (!instance) return false
    instance.handle.close()
    return true
  }

  function register(renderer: FilePreviewRendererDefinition) {
    custom.value = [renderer, ...custom.value.filter((entry) => entry.kind !== renderer.kind)]
    return () => {
      custom.value = custom.value.filter((entry) => entry !== renderer)
    }
  }

  function attach() {
    providers.value += 1
    let attached = true
    return () => {
      if (!attached) return
      attached = false
      providers.value -= 1
    }
  }

  return {
    attach,
    close,
    closeAll: () => {
      for (const instance of instances.value) instance.handle.close()
    },
    instances: computed(() => instances.value),
    isOpen: (id) => (id ? find(id) !== null : instances.value.length > 0),
    mounted: computed(() => providers.value > 0),
    open,
    register,
    renderers,
  }
}

/**
 * Provides the file preview API to a subtree. Inside a Nuxt app it reuses the app-wide instance,
 * so previews opened from actions outside setup render in this provider.
 */
export function provideFilePreview() {
  const api = inject(filePreviewApiKey, null) ?? createFilePreviewApi()
  provide(filePreviewApiKey, api)
  return api
}

/**
 * Returns the file preview API.
 *
 * @example
 * const filePreview = useFilePreview()
 * filePreview.open(files, { index: 2 })
 */
export function useFilePreview() {
  const api = inject(filePreviewApiKey, null)
  if (!api)
    throw new Error('File preview API is not provided. Wrap your app with <UiFilePreviewProvider>.')
  return api
}
