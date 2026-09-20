import { debounceFilter, throttleFilter, watchWithFilter } from '@vueuse/core'
import { computed, onMounted } from 'vue'

import type { FormValue, FormField } from '../types'
import { isEqualFormValue } from '../utils/compare'
import { cloneFormValue } from '../utils/path'
import { isFunction, isNumber, isObject } from '../utils/predicate'
import { useFormRuntimeContext } from './use-form-runtime'

const UNSET: FormValue = Symbol('unset')

export function useFieldEffects(field: () => FormField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const api = computed(() => form.getFieldApi(path(), field()))
  const params = computed(() => form.getFieldCallbackParams(path(), field()))

  let lastValue: FormValue = UNSET
  let lastDeps: FormValue = UNSET
  watchWithFilter(
    () => form.getValue(path()),
    (value) => {
      if (lastValue !== UNSET && isEqualFormValue(value, lastValue)) {
        return
      }
      lastValue = cloneFormValue(value)
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
    (deps) => {
      if (lastDeps !== UNSET && isEqualFormValue(deps, lastDeps)) {
        return
      }
      lastDeps = cloneFormValue(deps)
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
