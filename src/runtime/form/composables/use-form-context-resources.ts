import { useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, reactive } from 'vue'

import type { GenericObject } from '../../shared/types/utils'
import type { FormValue } from '../types'
import type {
  FormAsyncResource,
  FormRuntimeContext,
  FormRuntimeQueryOptions,
  FormSyncResource,
} from '../types'
import { isRecord } from '../utils/path'
import { isFunction, isPromise, isUndefined } from '../utils/predicate'

type RuntimeResource = FormSyncResource<FormValue> | FormAsyncResource<FormValue>
export function useFormContextResources() {
  const context = reactive<FormRuntimeContext>({})
  const queryClient = useQueryClient()

  function setContext(definition: GenericObject | undefined) {
    for (const key of Object.keys(context)) delete context[key]

    if (!definition) return

    for (const key of Object.keys(definition)) {
      const source = Object.getOwnPropertyDescriptor(definition, key)?.value
      context[key] = createResource(source, queryClient)
    }
  }

  return {
    context,
    setContext,
  }
}

export function getSchemaContext(schema: FormValue) {
  if (!isRecord(schema)) return undefined
  const context = Object.getOwnPropertyDescriptor(schema, 'context')?.value
  return isRecord(context) ? context : undefined
}

function createResource(source: FormValue, queryClient: QueryClient): RuntimeResource {
  const raw = resolveResourceSource(source)

  if (isPromise(raw)) {
    const resource: FormAsyncResource<FormValue> = {
      value: undefined,
      error: null,
      pending: true,
      fetching: false,
      loading: true,
      refresh: async () => {},
    }

    resource.refresh = async () => {
      const nextSource = resolveResourceSource(source)
      resource.pending = isUndefined(resource.value)
      resource.fetching = !isUndefined(resource.value)
      resource.loading = resource.pending
      try {
        resource.value = await nextSource
        resource.error = null
      } catch (error) {
        resource.error = error
      } finally {
        resource.pending = false
        resource.fetching = false
        resource.loading = false
      }
    }

    void resource.refresh()
    return resource
  }

  if (isQueryLike(raw)) {
    const querySource = computed(() => {
      const nextSource = resolveResourceSource(source)
      return isQueryLike(nextSource) ? nextSource : null
    })
    const query = useQuery<FormValue, Error, FormValue>(() => {
      const nextSource = querySource.value
      if (!nextSource)
        return {
          queryKey: ['form-context', 'disabled'],
          queryFn: async () => undefined,
          enabled: false,
        }

      return nextSource
    })

    const resource: FormAsyncResource<FormValue> = {
      get value() {
        return query.data.value
      },
      set value(value) {
        const nextSource = querySource.value
        if (nextSource) queryClient.setQueryData<FormValue, FormValue>(nextSource.queryKey, value)
      },
      get error() {
        return query.error.value ?? null
      },
      get pending() {
        return query.isPending.value
      },
      get fetching() {
        return query.isFetching.value && !query.isPending.value
      },
      get loading() {
        return query.isPending.value
      },
      refresh: async () => {
        await query.refetch()
      },
    }

    return resource
  }

  return { value: raw }
}

function resolveResourceSource(source: FormValue) {
  return isFunction(source) ? source() : source
}

function isQueryLike(value: FormValue): value is FormRuntimeQueryOptions {
  if (!isRecord(value)) return false
  const queryKey = Object.getOwnPropertyDescriptor(value, 'queryKey')?.value
  return Array.isArray(queryKey)
}
