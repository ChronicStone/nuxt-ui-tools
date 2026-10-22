import { useQuery } from '@tanstack/vue-query'
import type { QueryKey } from '@tanstack/vue-query'
import { computed, ref, shallowRef, unref, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type { DisplayKind, DisplayPropsMap } from '../../../display/types'
import { isPlainObject, isPromise } from '../../../shared/utils/predicate'
import type { FormFieldCallbackParams, FormRuntimeQueryOptions, FormValue } from '../../types'
import { resolveFormDynamic } from '../../utils/dynamic'
import { isRecord } from '../../utils/path'
import type { FormInfoDisplayField } from './types'

type DisplayProps = DisplayPropsMap[DisplayKind]

/**
 * Resolves the props of a display field: static, derived from its dependencies, or loaded through
 * a promise or TanStack Query options. A promise from an older run never overwrites a newer one.
 */
export function useInfoDisplay(params: {
  field: () => FormInfoDisplayField | undefined
  callbackParams: ComputedRef<FormFieldCallbackParams>
  path: () => readonly string[]
}) {
  const attempt = ref<number>(0)
  const promiseRun = ref<number>(0)
  const promiseProps = shallowRef<DisplayProps | undefined>(undefined)
  const promisePending = ref<boolean>(false)
  const promiseError = shallowRef<FormValue | null>(null)

  const source = computed(() => {
    void attempt.value
    const field = params.field()
    return field
      ? resolveFormDynamic<FormValue, FormFieldCallbackParams>(
          field.props,
          params.callbackParams.value,
        )
      : undefined
  })
  const querySource = computed(() => (isQueryOptions(source.value) ? source.value : null))
  const query = useQuery<FormValue, Error, FormValue, QueryKey>(
    computed(
      () =>
        querySource.value ?? {
          enabled: false,
          queryFn: async () => null,
          queryKey: ['form-info', params.path().join('.'), 'disabled'],
        },
    ),
  )

  watch(
    source,
    async (current) => {
      if (!isPromise(current)) {
        promiseRun.value += 1
        promisePending.value = false
        promiseError.value = null
        return
      }
      const run = promiseRun.value + 1
      promiseRun.value = run
      promisePending.value = true
      promiseError.value = null
      try {
        const result: FormValue = await current
        if (promiseRun.value !== run) return
        promiseProps.value = isDisplayProps(result) ? result : undefined
      } catch (caughtError) {
        if (promiseRun.value === run) promiseError.value = caughtError
      } finally {
        if (promiseRun.value === run) promisePending.value = false
      }
    },
    { immediate: true },
  )

  const props = computed<DisplayProps | undefined>(() => {
    const current = source.value
    if (querySource.value) {
      const data = unref(query.data)
      return isDisplayProps(data) ? data : undefined
    }
    if (isPromise(current)) return promisePending.value ? undefined : promiseProps.value
    return isDisplayProps(current) ? current : undefined
  })
  const pending = computed<boolean>(() => {
    if (querySource.value) return unref(query.isPending) && unref(query.fetchStatus) !== 'idle'
    return promisePending.value
  })
  const error = computed<FormValue | null>(() =>
    querySource.value ? (unref(query.error) ?? null) : promiseError.value,
  )

  function retry() {
    if (querySource.value) void query.refetch()
    else attempt.value += 1
  }

  return { error, pending, props, retry }
}

function isQueryOptions(value: FormValue): value is FormRuntimeQueryOptions {
  return isRecord(value) && Array.isArray(Object.getOwnPropertyDescriptor(value, 'queryKey')?.value)
}

/** Display props are plain objects; the kind's component reads the keys it knows. */
function isDisplayProps(value: FormValue): value is DisplayProps {
  return isPlainObject(value) && !isQueryOptions(value)
}
