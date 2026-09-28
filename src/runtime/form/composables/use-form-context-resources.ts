import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient } from '@tanstack/vue-query'
import { computed, reactive } from 'vue'

import type { GenericObject } from '../../shared/types/utils'
import type {
  FormValue,
  FormAsyncResource,
  FormRuntimeContext,
  FormRuntimeQueryOptions,
  FormSyncResource,
} from '../types'
import { isRecord } from '../utils/path'
import { isFunction, isPromise, isUndefined } from '../utils/predicate'
import { isServerRendering } from '../utils/ssr'

type RuntimeResource = FormSyncResource<FormValue> | FormAsyncResource<FormValue>

/**
 * Resources the schema declares in `context`. A promise or query resource loads in the browser:
 * while the server renders, it stays pending unless the query cache already holds its data, so
 * the hydrating page renders it the same way.
 */
export function useFormContextResources() {
  const context = reactive<FormRuntimeContext>({})
  const queryClient = useQueryClient()
  const serverRendering = isServerRendering()

  function setContext(definition: GenericObject | undefined) {
    for (const key of Object.keys(context)) {
      delete context[key]
    }

    if (!definition) {
      return
    }

    for (const key of Object.keys(definition)) {
      const source = Object.getOwnPropertyDescriptor(definition, key)?.value
      context[key] = createResource(source, { queryClient, serverRendering })
    }
  }

  return {
    context,
    setContext,
  }
}

export function getSchemaContext(schema: FormValue) {
  if (!isRecord(schema)) {
    return
  }
  const context = Object.getOwnPropertyDescriptor(schema, 'context')?.value
  return isRecord(context) ? context : undefined
}

function createResource(
  source: FormValue,
  options: { queryClient: QueryClient; serverRendering: boolean },
): RuntimeResource {
  const { queryClient, serverRendering } = options
  const raw = resolveResourceSource(source)

  if (isPromise(raw)) {
    const resource: FormAsyncResource<FormValue> = {
      error: null,
      fetching: false,
      loading: true,
      pending: true,
      refresh: async () => {},
      value: undefined,
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

    if (!serverRendering) {
      void resource.refresh()
    }
    return resource
  }

  if (isQueryLike(raw)) {
    const querySource = computed(() => {
      const nextSource = resolveResourceSource(source)
      return isQueryLike(nextSource) ? nextSource : null
    })
    const query = useQuery<FormValue, Error, FormValue>(() => {
      const nextSource = querySource.value
      if (!nextSource) {
        return {
          enabled: false,
          queryFn: async () => {},
          queryKey: ['form-context', 'disabled'],
        }
      }

      return serverRendering ? { ...nextSource, enabled: false } : nextSource
    })

    const resource: FormAsyncResource<FormValue> = {
      get error() {
        return query.error.value ?? null
      },
      get fetching() {
        return query.isFetching.value && !query.isPending.value
      },
      get loading() {
        return query.isPending.value
      },
      get pending() {
        return query.isPending.value
      },
      refresh: async () => {
        await query.refetch()
      },
      get value() {
        return query.data.value
      },
      set value(value) {
        const nextSource = querySource.value
        if (nextSource) {
          queryClient.setQueryData<FormValue, FormValue>(nextSource.queryKey, value)
        }
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
  if (!isRecord(value)) {
    return false
  }
  const queryKey = Object.getOwnPropertyDescriptor(value, 'queryKey')?.value
  return Array.isArray(queryKey)
}
