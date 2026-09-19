import { debounceFilter, throttleFilter, watchWithFilter } from '@vueuse/core'
import { computed, onMounted } from 'vue'

import type { FormField } from '../types'
import { isFunction, isNumber, isObject } from '../utils/predicate'
import { useFormRuntimeContext } from './use-form-runtime'

export function useFieldEffects(field: () => FormField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const api = computed(() => form.getFieldApi(path(), field()))
  const params = computed(() => form.getFieldCallbackParams(path(), field()))

  watchWithFilter(
    () => form.getValue(path()),
    (value) => {
      const effect = Object.getOwnPropertyDescriptor(field(), 'watch')?.value
      if (isFunction(effect)) {
        form.trackEffect(effect({ api: api.value, value }))
      }
    },
    {
      ...resolveWatchOptions(field()),
      eventFilter: resolveEffectFilter(field()),
    },
  )

  watchWithFilter(
    () => params.value.deps,
    () => {
      const effect = Object.getOwnPropertyDescriptor(field(), 'onDependencyChange')?.value
      if (isFunction(effect)) {
        form.trackEffect(effect(params.value))
      }
    },
    { deep: true, eventFilter: resolveEffectFilter(field()) },
  )

  onMounted(() => {
    const effect = Object.getOwnPropertyDescriptor(field(), 'onRendered')?.value
    if (isFunction(effect)) {
      form.trackEffect(effect(params.value))
    }
  })
}

function resolveWatchOptions(field: FormField) {
  const options = Object.getOwnPropertyDescriptor(field, 'watchOptions')?.value
  if (!isObject(options) || options === null || Array.isArray(options)) {
    return {}
  }
  return {
    deep: options.deep === true,
    immediate: options.immediate === true,
  }
}

function resolveEffectFilter(field: FormField) {
  const effect = Object.getOwnPropertyDescriptor(field, 'stateEffect')?.value
  if (!isObject(effect) || effect === null || Array.isArray(effect)) {
    return
  }
  const duration = isNumber(effect.duration) ? effect.duration : 0
  if (effect.type === 'debounce') {
    return debounceFilter(duration)
  }
  if (effect.type === 'throttle') {
    return throttleFilter(duration)
  }
}
