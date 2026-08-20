import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { QueryKey } from '@tanstack/vue-query'
import { computed, nextTick, onScopeDispose, ref, shallowRef, unref, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type { FormValue } from '../types'
import type {
  FormAsyncResource,
  FormField,
  FormFieldApi,
  FormFieldCallbackParams,
  FormOptionConfig,
  FormOptionValue,
  FormRuntime,
  FormRuntimeQueryOptions,
} from '../types'
import { createFormFieldInstance } from '../utils/field-instance'
import {
  formOptionKey,
  mergeResolvedOptions,
  normalizeOptionItem,
  normalizeOptionItems,
  normalizeOptionSelection,
  type FormOptionKeys,
  type ResolvedFormOption,
} from '../utils/options'
import { isRecord, relativePathSegments } from '../utils/path'
import {
  isBoolean,
  isFunction,
  isNumber,
  isObject,
  isPromise,
  isString,
  isUndefined,
} from '../utils/predicate'
import { resolveFormText } from '../utils/text'

export function useFieldOptions(params: {
  field: () => FormField
  path: () => readonly string[]
  api: ComputedRef<FormFieldApi>
  callbackParams: ComputedRef<FormFieldCallbackParams>
  register: FormRuntime['registerFieldOptions']
  refreshFieldOptions: FormRuntime['refreshFieldOptions']
}) {
  const promiseOptions = shallowRef<readonly FormValue[]>([])
  const createdOptions = shallowRef<readonly FormValue[]>([])
  const promisePending = ref<boolean>(false)
  const promiseFetching = ref<boolean>(false)
  const promiseError = ref<FormValue | null>(null)
  const promiseRun = ref<number>(0)
  const refreshRun = ref<number>(0)
  const promiseResolution = shallowRef<Promise<void> | null>(null)
  const creating = ref<boolean>(false)
  const trackedOptionSource = computed(() => {
    void refreshRun.value
    return resolveTrackedOptionSource(params.field(), params.callbackParams.value)
  })
  const resolvedSource = computed(() => trackedOptionSource.value.source)
  const optionKeys = computed<FormOptionKeys>(() => resolveOptionKeys(params.field()))
  const contextResources = computed(() => {
    const ctx = params.callbackParams.value.ctx
    if (!isRecord(ctx)) return []
    return trackedOptionSource.value.contextKeys
      .map((key) => Object.getOwnPropertyDescriptor(ctx, key)?.value)
      .filter(isAsyncResource)
  })
  const contextPending = computed<boolean>(() =>
    contextResources.value.some((resource) => resource.pending && isUndefined(resource.value)),
  )
  const contextFetching = computed<boolean>(() =>
    contextResources.value.some((resource) => resource.fetching && !isUndefined(resource.value)),
  )
  const contextError = computed<FormValue | null>(
    () => contextResources.value.find((resource) => resource.error !== null)?.error ?? null,
  )
  const optionConfig = computed(() => resolveOptionConfig(params.field()))
  const querySource = computed(() => {
    const source = resolvedSource.value
    return isRuntimeQueryOptions(source) ? source : null
  })

  const optionQuery = useQuery<FormValue, Error, FormValue, QueryKey>(
    computed(() => {
      const source = querySource.value
      if (!source)
        return {
          queryKey: ['form-options', params.path().join('.'), 'disabled'],
          queryFn: async () => [],
          enabled: false,
        }

      return {
        placeholderData: keepPreviousData,
        ...source,
      }
    }),
  )

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

      const resolution = resolvePromiseOptions(source)
      promiseResolution.value = resolution
      await resolution
      if (promiseResolution.value === resolution) promiseResolution.value = null
    },
    { immediate: true },
  )

  const sourceItems = computed<readonly ResolvedFormOption[]>(() => {
    if (querySource.value) {
      const data = unref(optionQuery.data)
      return normalizeOptionItems(Array.isArray(data) ? data : [], optionKeys.value)
    }
    return normalizeOptionItems(promiseOptions.value, optionKeys.value)
  })
  const items = computed<readonly ResolvedFormOption[]>(() =>
    mergeResolvedOptions(
      sourceItems.value,
      normalizeOptionItems(createdOptions.value, optionKeys.value),
    ),
  )
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
  const error = computed<FormValue | null>(() => {
    if (contextError.value !== null) return contextError.value
    if (trackedOptionSource.value.error !== null) return trackedOptionSource.value.error
    if (querySource.value) return unref(optionQuery.error) ?? null
    return promiseError.value
  })
  const refreshable = computed<boolean>(() => optionConfig.value?.allowOptionsRefresh === true)
  const creatable = computed<boolean>(() => hasCreateHandler(optionConfig.value?.create))
  const createLabel = computed<string | undefined>(() =>
    resolveFormText(optionConfig.value?.create?.label),
  )
  const disableOnLoading = computed<boolean>(() => optionConfig.value?.disableOnLoading !== false)
  const selectCreatedOption = computed<boolean>(
    () => optionConfig.value?.create?.selectOnCreation !== false,
  )

  const state = {
    items,
    pending,
    fetching,
    loading,
    creating: computed(() => creating.value),
    creatable,
    createLabel,
    error,
    disableOnLoading,
    refreshable,
    selectCreatedOption,
    refresh,
    add,
    create,
  }

  const unregister = params.register(params.path(), state)
  onScopeDispose(unregister)

  watch(
    sourceItems,
    (nextOptions, previousOptions) => {
      if (optionConfig.value?.onOptionsChange) {
        optionConfig.value.onOptionsChange(nextOptions, {
          ...params.callbackParams.value,
          previousOptions: previousOptions ?? [],
        })
      }
    },
    { immediate: true },
  )

  watch(items, (nextOptions) => clearInvalidValue(nextOptions), { immediate: true })

  async function refresh() {
    await Promise.all(contextResources.value.map((resource) => resource.refresh()))
    if (querySource.value) {
      await optionQuery.refetch()
      return
    }

    refreshRun.value += 1
    await nextTick()
    await promiseResolution.value
  }

  function add(option: FormValue) {
    const normalized = normalizeOptionItem(option, optionKeys.value)
    if (items.value.some((item) => formOptionKey(item.value) === formOptionKey(normalized.value)))
      return normalized
    createdOptions.value = [...createdOptions.value, option]
    return normalized
  }

  async function create(label: string) {
    const normalizedLabel = label.trim()
    if (!normalizedLabel || creating.value) return null

    const createOption = optionConfig.value?.create
    if (!isRecord(createOption)) return null

    const handler = Object.getOwnPropertyDescriptor(createOption, 'handler')?.value
    if (!isFunction(handler)) return null

    creating.value = true
    try {
      const result = await handler({
        ...params.callbackParams.value,
        label: normalizedLabel,
      })
      if (result === null || isUndefined(result)) return null

      const normalized = add(result)
      if (selectCreatedOption.value) selectOption(normalized.value)
      await params.refreshFieldOptions(
        resolveRevalidatePaths(params.path(), createOption.revalidateFieldOptions ?? []),
      )
      return normalized
    } finally {
      creating.value = false
    }
  }

  function selectOption(value: FormOptionValue) {
    if (Object.getOwnPropertyDescriptor(params.field(), 'multiple')?.value !== true) {
      params.api.value.value.set(value)
      return
    }

    const current = params.api.value.value.get()
    const selected = Array.isArray(current) ? current.filter(isOptionValue) : []
    if (selected.some((item) => formOptionKey(item) === formOptionKey(value))) return
    params.api.value.value.set([...selected, value])
  }

  function clearInvalidValue(options: readonly ResolvedFormOption[]) {
    if (!optionConfig.value) return
    if (pending.value) return
    if (optionConfig.value?.clearOnInvalid === false) return

    const current = params.api.value.value.get()
    const nextValue = normalizeOptionSelection(current, options)
    if (!hasSelectionChanged(current, nextValue)) return
    params.api.value.value.set(nextValue)
  }

  async function resolvePromiseOptions(source: Promise<FormValue>) {
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

function resolveOptionConfig(field: FormField): FormOptionConfig<FormValue> | undefined {
  if (!createFormFieldInstance(field).capability.has('options')) return undefined
  const options = Object.getOwnPropertyDescriptor(field, 'options')?.value
  return isFormOptionConfig(options) ? options : undefined
}

function resolveOptionSource(field: FormField, params: FormFieldCallbackParams) {
  if (!createFormFieldInstance(field).capability.has('options')) return []

  const options = Object.getOwnPropertyDescriptor(field, 'options')?.value
  const source = isRecord(options) && 'source' in options ? options.source : options
  return isFunction(source) ? source(params) : source
}

function resolveTrackedOptionSource(field: FormField, params: FormFieldCallbackParams) {
  const contextKeys = new Set<string>()
  const trackedParams = {
    ...params,
    ctx: trackContextAccess(params.ctx, contextKeys),
  }

  try {
    return {
      source: resolveOptionSource(field, trackedParams),
      contextKeys: [...contextKeys],
      error: null,
    }
  } catch (error) {
    return { source: null, contextKeys: [...contextKeys], error }
  }
}

function resolveOptionKeys(field: FormField): FormOptionKeys {
  if (!createFormFieldInstance(field).type.isAny(['tree', 'tree-select', 'cascader'])) return {}
  return {
    value: resolveStringProperty(field, 'valueKey'),
    label: resolveStringProperty(field, 'labelKey'),
    children: resolveStringProperty(field, 'childrenKey'),
  }
}

function resolveStringProperty(value: FormValue, key: string) {
  if (!isObject(value)) return undefined
  const property = Object.getOwnPropertyDescriptor(value, key)?.value
  return isString(property) ? property : undefined
}

function trackContextAccess(ctx: FormFieldCallbackParams['ctx'], contextKeys: Set<string>) {
  return new Proxy(ctx, {
    get(target, property) {
      if (isString(property)) contextKeys.add(property)
      return Object.getOwnPropertyDescriptor(target, property)?.value
    },
  })
}

function isRuntimeQueryOptions(value: FormValue): value is FormRuntimeQueryOptions {
  if (!isRecord(value)) return false
  const queryKey = Object.getOwnPropertyDescriptor(value, 'queryKey')?.value
  return Array.isArray(queryKey)
}

function isAsyncResource(value: FormValue): value is FormAsyncResource<FormValue> {
  if (!isRecord(value)) return false
  return (
    'pending' in value && 'fetching' in value && 'refresh' in value && isFunction(value.refresh)
  )
}

function isFormOptionConfig(value: FormValue): value is FormOptionConfig<FormValue> {
  return isRecord(value) && 'source' in value
}

function hasCreateHandler(value: FormValue) {
  if (!isRecord(value)) return false
  return isFunction(Object.getOwnPropertyDescriptor(value, 'handler')?.value)
}

function resolveRevalidatePaths(path: readonly string[], revalidatePaths: readonly string[]) {
  const parentPath = path.slice(0, -1)
  return revalidatePaths.map((revalidatePath) => {
    if (revalidatePath.startsWith('$parent'))
      return relativePathSegments(parentPath, revalidatePath)
    return revalidatePath
  })
}

function hasSelectionChanged(current: FormValue, next: FormValue) {
  if (!Array.isArray(current) || !Array.isArray(next)) return current !== next
  if (current.length !== next.length) return true
  return current.some((value, index) => value !== next[index])
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
