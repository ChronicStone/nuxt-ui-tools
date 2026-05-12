import { useQuery } from '@tanstack/vue-query'
import { computed, onScopeDispose, ref, shallowRef, unref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { QueryKey } from '@tanstack/vue-query'

import type {
  FormAsyncResource,
  FormField,
  FormFieldApi,
  FormFieldCallbackParams,
  FormRuntime,
  FormRuntimeQueryOptions,
} from '../types'
import { createFormFieldInstance } from '../utils/field-instance'
import { normalizeOptionItem, normalizeOptionItems, type ResolvedFormOption } from '../utils/options'
import { isRecord } from '../utils/path'

export function useFieldOptions(params: {
  field: () => FormField
  path: () => readonly string[]
  api: ComputedRef<FormFieldApi>
  callbackParams: ComputedRef<FormFieldCallbackParams>
  register: FormRuntime['registerFieldOptions']
}) {
  const promiseOptions = shallowRef<readonly unknown[]>([])
  const createdOptions = shallowRef<readonly unknown[]>([])
  const promisePending = ref<boolean>(false)
  const promiseFetching = ref<boolean>(false)
  const promiseError = ref<unknown | null>(null)
  const promiseRun = ref<number>(0)
  const trackedOptionSource = computed(() => resolveTrackedOptionSource(params.field(), params.callbackParams.value))
  const resolvedSource = computed(() => trackedOptionSource.value.source)
  const contextResources = computed(() => {
    const ctx = params.callbackParams.value.ctx
    if (!isRecord(ctx)) return []
    return trackedOptionSource.value.contextKeys
      .map(key => Object.getOwnPropertyDescriptor(ctx, key)?.value)
      .filter(isAsyncResource)
  })
  const contextPending = computed<boolean>(() => contextResources.value.some(resource =>
    resource.pending && typeof resource.value === 'undefined',
  ))
  const contextFetching = computed<boolean>(() => contextResources.value.some(resource =>
    resource.fetching && typeof resource.value !== 'undefined',
  ))
  const contextError = computed<unknown | null>(() =>
    contextResources.value.find(resource => resource.error !== null)?.error ?? null,
  )
  const optionConfig = computed(() => resolveOptionConfig(params.field()))
  const querySource = computed(() => {
    const source = resolvedSource.value
    return isRuntimeQueryOptions(source) ? source : null
  })

  const optionQuery = useQuery<readonly unknown[]>({
    queryKey: computed<QueryKey>(() => querySource.value?.queryKey ?? ['form-options', params.path().join('.'), 'disabled']),
    queryFn: async () => {
      const query = querySource.value
      if (!query?.queryFn) return []

      const result = await query.queryFn()
      return Array.isArray(result) ? result : []
    },
    enabled: computed<boolean>(() =>
      Boolean(querySource.value?.queryFn)
      && querySource.value?.enabled !== false
      && !contextPending.value,
    ),
    placeholderData: previous => previous,
  })

  watch(
    resolvedSource,
    async (source) => {
      if (isRuntimeQueryOptions(source)) {
        promisePending.value = false
        promiseFetching.value = false
        promiseError.value = null
        return
      }

      if (Array.isArray(source)) {
        promiseOptions.value = source
        promisePending.value = false
        promiseFetching.value = false
        promiseError.value = null
        return
      }

      if (!isPromise(source)) {
        promiseOptions.value = []
        promisePending.value = false
        promiseFetching.value = false
        promiseError.value = null
        return
      }

      await resolvePromiseOptions(source)
    },
    { immediate: true },
  )

  const sourceItems = computed<readonly ResolvedFormOption[]>(() => {
    if (querySource.value) return normalizeOptionItems(unref(optionQuery.data))
    return normalizeOptionItems(promiseOptions.value)
  })
  const items = computed<readonly ResolvedFormOption[]>(() => [
    ...sourceItems.value,
    ...createdOptions.value.map(option => normalizeOptionItem(option)),
  ])
  const hasItems = computed<boolean>(() => items.value.length > 0)
  const pending = computed<boolean>(() => {
    if (contextPending.value && !hasItems.value) return true
    if (querySource.value) return unref(optionQuery.isPending) && !hasItems.value
    return promisePending.value && !hasItems.value
  })
  const fetching = computed<boolean>(() => {
    if (contextFetching.value && hasItems.value) return true
    if (querySource.value) return unref(optionQuery.isFetching) && hasItems.value
    return promiseFetching.value && hasItems.value
  })
  const loading = computed<boolean>(() => pending.value)
  const error = computed<unknown | null>(() => {
    if (contextError.value !== null) return contextError.value
    if (querySource.value) return unref(optionQuery.error) ?? null
    return promiseError.value
  })
  const disableOnLoading = computed<boolean>(() => optionConfig.value?.disableOnLoading === true)

  const state = {
    items,
    pending,
    fetching,
    loading,
    error,
    disableOnLoading,
    refresh,
    add,
    create,
  }

  const unregister = params.register(params.path(), state)
  onScopeDispose(unregister)

  async function refresh() {
    const source = resolvedSource.value
    await Promise.all(contextResources.value.map(resource => resource.refresh()))
    if (querySource.value) {
      await optionQuery.refetch()
      return
    }

    if (isPromise(source)) await resolvePromiseOptions(source)
  }

  function add(option: unknown) {
    createdOptions.value = [...createdOptions.value, option]
  }

  async function create(_label: string) {
    const createOption = optionConfig.value?.create
    if (!isRecord(createOption)) return null

    const handler = Object.getOwnPropertyDescriptor(createOption, 'handler')?.value
    if (typeof handler !== 'function') return null

    const result = await handler(params.callbackParams.value)
    if (result === null || typeof result === 'undefined') return null

    createdOptions.value = [...createdOptions.value, result]
    return normalizeOptionItem(result)
  }

  async function resolvePromiseOptions(source: Promise<unknown>) {
    const run = promiseRun.value + 1
    promiseRun.value = run
    promisePending.value = promiseOptions.value.length === 0
    promiseFetching.value = promiseOptions.value.length > 0

    try {
      const result = await source
      if (promiseRun.value !== run) return

      promiseOptions.value = Array.isArray(result) ? result : []
      promiseError.value = null
    } catch (caughtError) {
      if (promiseRun.value !== run) return
      promiseError.value = caughtError
    } finally {
      if (promiseRun.value === run) {
        promisePending.value = false
        promiseFetching.value = false
      }
    }
  }

  return state
}

function resolveOptionConfig(field: FormField) {
  if (!createFormFieldInstance(field).type.is('select')) return undefined
  const options = Object.getOwnPropertyDescriptor(field, 'options')?.value
  return isRecord(options) && 'source' in options ? options : undefined
}

function resolveOptionSource(field: FormField, params: FormFieldCallbackParams) {
  if (!createFormFieldInstance(field).capability.has('options')) return []

  const options = Object.getOwnPropertyDescriptor(field, 'options')?.value
  const source = isRecord(options) && 'source' in options ? options.source : options
  return typeof source === 'function' ? source(params) : source
}

function resolveTrackedOptionSource(field: FormField, params: FormFieldCallbackParams) {
  const contextKeys = new Set<string>()
  const trackedParams = {
    ...params,
    ctx: trackContextAccess(params.ctx, contextKeys),
  }

  return {
    source: resolveOptionSource(field, trackedParams),
    contextKeys: [...contextKeys],
  }
}

function trackContextAccess(
  ctx: FormFieldCallbackParams['ctx'],
  contextKeys: Set<string>,
) {
  return new Proxy(ctx, {
    get(target, property, receiver) {
      if (typeof property === 'string') contextKeys.add(property)
      return Reflect.get(target, property, receiver)
    },
  })
}

function isRuntimeQueryOptions(value: unknown): value is FormRuntimeQueryOptions {
  if (!isRecord(value)) return false
  const queryKey = Object.getOwnPropertyDescriptor(value, 'queryKey')?.value
  return Array.isArray(queryKey)
}

function isPromise(value: unknown): value is Promise<unknown> {
  return isRecord(value) && typeof Object.getOwnPropertyDescriptor(value, 'then')?.value === 'function'
}

function isAsyncResource(value: unknown): value is FormAsyncResource<unknown> {
  if (!isRecord(value)) return false
  return 'pending' in value
    && 'fetching' in value
    && 'refresh' in value
    && typeof value.refresh === 'function'
}
