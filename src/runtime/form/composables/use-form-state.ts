import { computed, reactive, ref } from 'vue'
import type { ComputedRef } from 'vue'

import type { FormField, FormFieldApi, FormObject } from '../types'
import type { FormRuntimeContext } from '../types'
import { cloneFormValue, getPathValue, isRecord, setPathValue } from '../utils/path'
import { buildFormOutput, buildInitialFormState } from '../utils/state'

export type FormFieldApiFactory = (path: readonly string[], field?: FormField) => FormFieldApi

export function useFormState(params: {
  schema: ComputedRef<unknown>
  input?: ComputedRef<FormObject | undefined>
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
}) {
  const state = reactive<FormObject>({})
  const initialState = ref<FormObject>({})
  const output = computed(() =>
    buildFormOutput(params.schema.value, state, params.context, params.apiFactory),
  )
  const dirtyPaths = computed(() => collectDirtyPaths(initialState.value, state))
  const isDirty = computed(() => dirtyPaths.value.length > 0)

  function initialize(input = params.input?.value) {
    for (const key of Object.keys(state)) delete state[key]

    const initial = buildInitialFormState(params.schema.value, params.context, input)
    initialState.value = cloneFormObject(initial)
    for (const [key, value] of Object.entries(initial)) state[key] = value
  }

  function reset() {
    initialize()
  }

  return {
    state,
    output,
    dirtyPaths,
    isDirty,
    initialize,
    reset,
    getValue: (path: string | readonly string[]) => getPathValue(state, path),
    setValue: (path: string | readonly string[], value: unknown) =>
      setPathValue(state, path, value),
  }
}

function cloneFormObject(value: FormObject) {
  const cloned = cloneFormValue(value)
  return isRecord(cloned) ? cloned : {}
}

function collectDirtyPaths(
  initial: unknown,
  current: unknown,
  path: readonly string[] = [],
): readonly string[] {
  if (Array.isArray(initial) || Array.isArray(current))
    return collectArrayDirtyPaths(
      Array.isArray(initial) ? initial : [],
      Array.isArray(current) ? current : [],
      path,
    )

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
  initial: readonly unknown[],
  current: readonly unknown[],
  path: readonly string[],
) {
  if (initial.length !== current.length) return [path.join('.')]

  return current.flatMap((value, index) =>
    collectDirtyPaths(initial[index], value, [...path, String(index)]),
  )
}
