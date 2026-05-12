import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'

import type {
  FormField,
  FormFieldApi,
  FormFieldCallbackParams,
  FormObject,
  FormRuntime,
  FormRuntimeStep,
  UseFormRuntimeParams,
} from '../types'
import { resolveFieldDependencies } from '../utils/dependencies'
import {
  childParentPath,
  fieldPath,
  getSchemaFields,
  getSchemaSteps,
  isSteppedSchema,
  shouldRenderField,
} from '../utils/state'
import { isRecord } from '../utils/path'
import { getSchemaContext, useFormContextResources } from './use-form-context-resources'
import { useFormOptionRegistry } from './use-form-option-registry'
import { useFormState } from './use-form-state'
import { useFormSubmitController } from './use-form-submit'
import { useFormValidation } from './use-form-validation'

const formRuntimeKey: InjectionKey<FormRuntime> = Symbol('nuxt-ui-tools-form-runtime')

export function provideFormRuntime(runtime: FormRuntime) {
  provide(formRuntimeKey, runtime)
}

export function useFormRuntimeContext() {
  const runtime = inject(formRuntimeKey)
  if (!runtime) throw new Error('Form runtime is not provided.')
  return runtime
}

export function useFormRuntime(params: UseFormRuntimeParams): FormRuntime {
  const { context, setContext } = useFormContextResources()
  const optionRegistry = useFormOptionRegistry()
  const currentStepIndex = ref<number>(0)

  setContext(getSchemaContext(params.schema.value))

  const apiFactory = (path: readonly string[], field?: FormField) => createFieldApi({
    path,
    field,
    getValue: state.getValue,
    setValue: state.setValue,
    ctx: context,
    state: state.state,
    optionRegistry,
    setExternalError: message => validation.setError(path, message),
    clearExternalError: () => validation.clearError(path),
    validateField: () => field
      ? validation.validateFields([field], path.slice(0, -1))
      : Promise.resolve(true),
  })

  const state = useFormState({
    schema: params.schema,
    input: params.input,
    context,
    apiFactory,
  })

  const validation = useFormValidation({
    schema: () => params.schema.value,
    state: state.state,
    context,
    apiFactory,
  })

  const submit = useFormSubmitController({
    validate: validation.validate,
    getOutput: () => state.output.value,
    getApi: () => createFormApi(runtime),
    getSchema: () => params.schema.value,
    getContext: () => context,
  })

  state.initialize()

  watch(params.schema, (schema) => {
    currentStepIndex.value = 0
    validation.clearError()
    setContext(getSchemaContext(schema))
    state.initialize(params.input?.value)
  })

  const currentFields = computed(() => {
    if (!isSteppedSchema(params.schema.value)) return getSchemaFields(params.schema.value)
    return getSchemaSteps(params.schema.value)[currentStepIndex.value]?.fields ?? []
  })
  const currentStepRoot = computed(() => {
    if (!isSteppedSchema(params.schema.value)) return undefined
    return getSchemaSteps(params.schema.value)[currentStepIndex.value]?.root
  })
  const steps = computed<readonly FormRuntimeStep[]>(() => getSchemaSteps(params.schema.value).map((step, index) => ({
    key: step.key ?? String(index + 1),
    label: typeof step.title === 'function' ? String(step.title()) : String(step.title ?? step.key ?? `Step ${index + 1}`),
    active: currentStepIndex.value === index,
    index,
    root: step.root,
  })))
  const currentStep = computed(() => steps.value[currentStepIndex.value] ?? null)
  const isStepped = computed(() => isSteppedSchema(params.schema.value))
  const isFirstStep = computed(() => currentStepIndex.value <= 0)
  const isLastStep = computed(() => currentStepIndex.value >= steps.value.length - 1)
  const canGoPrevious = computed(() => isStepped.value && !isFirstStep.value)
  const canGoNext = computed(() => isStepped.value && !isLastStep.value)

  function validateCurrentStep() {
    return validation.validateFields(currentFields.value, currentStepRoot.value ? [currentStepRoot.value] : [])
  }

  const runtime: FormRuntime = {
    schema: params.schema,
    state: state.state,
    output: state.output,
    dirtyPaths: state.dirtyPaths,
    isDirty: state.isDirty,
    errors: validation.errors,
    context,
    actionPending: submit.actionPending,
    currentStepIndex,
    currentFields,
    currentStepRoot,
    currentStep,
    steps,
    isStepped,
    isFirstStep,
    isLastStep,
    canGoPrevious,
    canGoNext,
    getValue: state.getValue,
    setValue: state.setValue,
    getFieldApi: apiFactory,
    getFieldCallbackParams: (path, field) => fieldCallbackParams({
      field,
      state: state.state,
      ctx: context,
      api: apiFactory(path, field),
      parentPath: path.slice(0, -1),
    }),
    registerFieldOptions: optionRegistry.register,
    getFieldError: validation.getFieldError,
    markFieldTouched: validation.markTouched,
    isFieldTouched: validation.isTouched,
    shouldRender: (field, path) => shouldRenderField(field, fieldCallbackParams({
      field,
      state: state.state,
      ctx: context,
      api: apiFactory(path, field),
      parentPath: path.slice(0, -1),
    })),
    validate: validation.validate,
    validateCurrentStep,
    clearErrors: () => validation.clearError(),
    submitHandler: submit.submitHandler,
    submit: async () => {
      const result = await submit.submitHandler()
      return result.success
    },
    reset: () => {
      validation.clearError()
      state.reset()
    },
    nextStep: async () => {
      const valid = await validateCurrentStep()
      if (!valid) return false

      currentStepIndex.value = Math.min(currentStepIndex.value + 1, getSchemaSteps(params.schema.value).length - 1)
      return true
    },
    previousStep: () => {
      currentStepIndex.value = Math.max(currentStepIndex.value - 1, 0)
      return true
    },
    goToStep: async (index) => {
      const nextIndex = Math.min(Math.max(index, 0), steps.value.length - 1)
      if (nextIndex === currentStepIndex.value) return true
      if (nextIndex > currentStepIndex.value) {
        const valid = await validateCurrentStep()
        if (!valid) return false
      }

      currentStepIndex.value = nextIndex
      return true
    },
  }

  return runtime
}

function createFormApi(runtime: FormRuntime) {
  return {
    get: runtime.getValue,
    set: runtime.setValue,
    validate: async () => runtime.validate(),
    submit: async () => {
      await runtime.submit()
    },
    reset: runtime.reset,
  }
}

function createFieldApi(params: {
  path: readonly string[]
  field?: FormField
  getValue: (path: string | readonly string[]) => unknown
  setValue: (path: string | readonly string[], value: unknown) => void
  ctx: FormRuntime['context']
  state: FormObject
  optionRegistry: ReturnType<typeof useFormOptionRegistry>
  setExternalError: (message: string) => void
  clearExternalError: () => void
  validateField: () => Promise<boolean>
}): FormFieldApi {
  const api: FormFieldApi<unknown, unknown, FormRuntime['context']> = {
    value: {
      get: () => params.getValue(params.path),
      set: value => params.setValue(params.path, value),
      reset: () => params.setValue(params.path, null),
    },
    options: {
      get: () => params.optionRegistry.get(params.path).items.value,
      pending: () => params.optionRegistry.get(params.path).pending.value,
      fetching: () => params.optionRegistry.get(params.path).fetching.value,
      loading: () => params.optionRegistry.get(params.path).loading.value,
      error: () => params.optionRegistry.get(params.path).error.value,
      refresh: () => params.optionRegistry.get(params.path).refresh(),
      add: option => params.optionRegistry.get(params.path).add(option),
      create: label => params.optionRegistry.get(params.path).create(label),
    },
    upload: {
      start: async () => {},
      cancel: async () => {},
      retry: async () => {},
      remove: async () => {},
    },
    context: {
      get: key => params.ctx[key],
      set: (key, value) => {
        params.ctx[key].value = value
      },
      update: (key, updater) => {
        updateContextResourceValue(params.ctx[key], updater)
      },
      patch: (key, value) => patchContextResourceValue(params.ctx[key], value),
      refresh: async (key) => {
        const resource = params.ctx[key]
        if (isRefreshableResource(resource)) await resource.refresh()
      },
      refreshAll: async () => {
        const refreshTasks = Object.values(params.ctx).map(resource =>
          isRefreshableResource(resource) ? resource.refresh() : Promise.resolve(),
        )

        await Promise.all(refreshTasks)
      },
    },
    validation: {
      validate: params.validateField,
      setError: params.setExternalError,
      clearError: params.clearExternalError,
    },
  }

  return api
}

function updateContextResourceValue<TResource extends { value: unknown }>(
  resource: TResource,
  updater: (value: TResource['value']) => TResource['value'],
) {
  resource.value = updater(resource.value)
}

function patchContextResourceValue(resource: unknown, patch: unknown) {
  if (!isContextValueResource(resource)) return

  const current = resource.value
  const patchValue = typeof patch === 'function' ? patch(current) : patch
  if (isRecord(current) && isRecord(patchValue)) {
    resource.value = { ...current, ...patchValue }
    return
  }

  resource.value = patchValue
}

function isContextValueResource(value: unknown): value is { value: unknown } {
  return typeof value === 'object'
    && value !== null
    && 'value' in value
}

function isRefreshableResource(value: unknown): value is { refresh: () => Promise<void> } {
  return typeof value === 'object'
    && value !== null
    && 'refresh' in value
    && typeof value.refresh === 'function'
}

function fieldCallbackParams(params: {
  field: FormField
  state: FormObject
  ctx: FormRuntime['context']
  api: FormFieldApi
  parentPath: readonly string[]
}): FormFieldCallbackParams {
  return {
    ctx: params.ctx,
    deps: resolveFieldDependencies(params),
    api: params.api,
  }
}

export { childParentPath, fieldPath }
