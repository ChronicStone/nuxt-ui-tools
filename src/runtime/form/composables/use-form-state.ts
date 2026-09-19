import { computed, reactive, ref } from 'vue'
import type { ComputedRef } from 'vue'

import type { FormValue, FormField, FormFieldApi, FormObject, FormRuntimeContext } from '../types'
import { cloneFormValue, getPathValue, isRecord, setPathValue } from '../utils/path'
import { buildFormOutput, buildInitialFormState } from '../utils/state'
import type { InitialStateApiFactory } from '../utils/state'

export type FormFieldApiFactory = (path: readonly string[], field?: FormField) => FormFieldApi

export function useFormState(params: {
  schema: ComputedRef<FormValue>
  input?: ComputedRef<FormObject | undefined>
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
  bootstrapApiFactory?: InitialStateApiFactory
  ignoreDirtyPaths?: () => readonly string[]
}) {
  const state = reactive<FormObject>({})
  const initialState = ref<FormObject>({})
  const output = computed(() =>
    buildFormOutput(params.schema.value, state, params.context, params.apiFactory),
  )
  const dirtyPaths = computed(() => {
    const ignored = params.ignoreDirtyPaths?.() ?? []
    return collectDirtyPaths(initialState.value, state).filter(
      (path) => !ignored.some((ignoredPath) => isPathWithin(path, ignoredPath)),
    )
  })
  const isDirty = computed(() => dirtyPaths.value.length > 0)

  function buildInitial(input: FormObject | undefined) {
    return buildInitialFormState(
      params.schema.value,
      params.context,
      input,
      params.bootstrapApiFactory,
    )
  }

  function initialize(input = params.input?.value) {
    for (const key of Object.keys(state)) {
      delete state[key]
    }

    const initial = buildInitial(input)
    initialState.value = cloneFormObject(initial)
    for (const [key, value] of Object.entries(initial)) {
      state[key] = value
    }
  }

  function reset() {
    initialize()
  }

  function rebaseline() {
    initialState.value = cloneFormObject(state)
  }

  function getInitialValue(path: string | readonly string[]) {
    return getPathValue(initialState.value, path)
  }

  function resetValue(path: string | readonly string[]) {
    setPathValue(state, path, cloneFormValue(getPathValue(initialState.value, path)))
  }

  function syncInput(input: FormObject | undefined, paths: boolean | readonly string[]) {
    if (!paths || (Array.isArray(paths) && paths.length === 0)) {
      return
    }
    if (paths === true) {
      initialize(input)
      return
    }

    const next = buildInitial(input)
    for (const path of paths) {
      const value = cloneFormValue(getPathValue(next, path))
      setPathValue(state, path, value)
      setPathValue(initialState.value, path, cloneFormValue(value))
    }
  }

  return {
    dirtyPaths,
    getInitialValue,
    getValue: (path: string | readonly string[]) => getPathValue(state, path),
    initialize,
    isDirty,
    output,
    rebaseline,
    reset,
    resetValue,
    setValue: (path: string | readonly string[], value: FormValue) =>
      setPathValue(state, path, value),
    state,
    syncInput,
  }
}

function isPathWithin(path: string, scope: string) {
  return path === scope || path.startsWith(`${scope}.`)
}

function cloneFormObject(value: FormObject) {
  const cloned = cloneFormValue(value)
  return isRecord(cloned) ? cloned : {}
}

function collectDirtyPaths(
  initial: FormValue,
  current: FormValue,
  path: readonly string[] = [],
): readonly string[] {
  if (Array.isArray(initial) || Array.isArray(current)) {
    return collectArrayDirtyPaths(
      Array.isArray(initial) ? initial : [],
      Array.isArray(current) ? current : [],
      path,
    )
  }

  if (isRecord(initial) || isRecord(current)) {
    const initialObject = isRecord(initial) ? initial : {}
    const currentObject = isRecord(current) ? current : {}
    const keys = new Set([...Object.keys(initialObject), ...Object.keys(currentObject)])
    return [...keys].flatMap((key) =>
      collectDirtyPaths(initialObject[key], currentObject[key], [...path, key]),
    )
  }

  return Object.is(initial, current) ? [] : [path.join('.')]
}

function collectArrayDirtyPaths(
  initial: readonly FormValue[],
  current: readonly FormValue[],
  path: readonly string[],
) {
  if (initial.length !== current.length) {
    return [path.join('.')]
  }

  return current.flatMap((value, index) =>
    collectDirtyPaths(initial[index], value, [...path, String(index)]),
  )
}
