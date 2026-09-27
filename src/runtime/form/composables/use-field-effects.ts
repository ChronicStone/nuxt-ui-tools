import { debounceFilter, throttleFilter, watchWithFilter } from '@vueuse/core'
import { computed, onMounted } from 'vue'

import type { FormValue, FormField } from '../types'
import { isEqualFormValue } from '../utils/compare'
import { cloneFormValue } from '../utils/path'
import { isFunction, isNumber, isObject } from '../utils/predicate'
import { useFormRuntimeContext } from './use-form-runtime'

const UNSET: FormValue = Symbol('unset')

/**
 * Runs a field's `watch`, `onDependencyChange`, and `onRendered` effects. A field without effects
 * sets up nothing, and the watchers of the others start once the form has painted, so a large form
 * does not pay for them before its first frame. A value that changed before they start still runs
 * its effect once.
 */
export function useFieldEffects(field: () => FormField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const valueEffect = Object.getOwnPropertyDescriptor(field(), 'watch')?.value
  const dependencyEffect = Object.getOwnPropertyDescriptor(field(), 'onDependencyChange')?.value
  const renderedEffect = Object.getOwnPropertyDescriptor(field(), 'onRendered')?.value
  if (!isFunction(valueEffect) && !isFunction(dependencyEffect) && !isFunction(renderedEffect)) {
    return
  }

  const api = computed(() => form.getFieldApi(path(), field()))
  const params = computed(() => form.getFieldCallbackParams(path(), field()))

  if (isFunction(valueEffect)) {
    const watchOptions = resolveWatchOptions(field())
    let lastValue: FormValue = watchOptions.immediate
      ? UNSET
      : cloneFormValue(form.getValue(path()))

    function runValueEffect(value: FormValue) {
      if (lastValue !== UNSET && isEqualFormValue(value, lastValue)) {
        return
      }
      lastValue = cloneFormValue(value)
      const effect = Object.getOwnPropertyDescriptor(field(), 'watch')?.value
      if (isFunction(effect)) {
        form.trackEffect(effect({ api: api.value, value }))
      }
    }

    form.render.afterPaint(() => {
      if (!watchOptions.immediate) {
        runValueEffect(form.getValue(path()))
      }
      watchWithFilter(() => form.getValue(path()), runValueEffect, {
        ...watchOptions,
        eventFilter: resolveEffectFilter(field()),
      })
    })
  }

  if (isFunction(dependencyEffect)) {
    let lastDeps: FormValue = cloneFormValue(params.value.deps)

    function runDependencyEffect(deps: FormValue) {
      if (isEqualFormValue(deps, lastDeps)) {
        return
      }
      lastDeps = cloneFormValue(deps)
      const effect = Object.getOwnPropertyDescriptor(field(), 'onDependencyChange')?.value
      if (isFunction(effect)) {
        form.trackEffect(effect(params.value))
      }
    }

    form.render.afterPaint(() => {
      runDependencyEffect(params.value.deps)
      watchWithFilter(() => params.value.deps, runDependencyEffect, {
        deep: true,
        eventFilter: resolveEffectFilter(field()),
      })
    })
  }

  if (isFunction(renderedEffect)) {
    onMounted(() => {
      form.render.afterPaint(() => {
        const effect = Object.getOwnPropertyDescriptor(field(), 'onRendered')?.value
        if (isFunction(effect)) {
          form.trackEffect(effect(params.value))
        }
      })
    })
  }
}

function resolveWatchOptions(field: FormField) {
  const options = Object.getOwnPropertyDescriptor(field, 'watchOptions')?.value
  if (!isObject(options) || options === null || Array.isArray(options)) {
    return { deep: false, immediate: false }
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
