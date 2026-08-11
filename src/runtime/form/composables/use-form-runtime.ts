import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'

import type {
  FormField,
  FormFieldApi,
  FormFieldCallbackParams,
  FormObject,
  FormRuntime,
  FormRuntimeStep,
  FormValidationOptions,
  UseFormRuntimeParams,
} from '../types'
import { createPublicFormApi } from '../utils/api'
import { resolveFieldDependencies } from '../utils/dependencies'
import { resolveFormLayoutConfig } from '../utils/layout'
import { isRecord } from '../utils/path'
import {
  childParentPath,
  collectFormFieldPaths,
  collectFormFieldsPaths,
  fieldPath,
  getSchemaFields,
  getSchemaLayout,
  getSchemaSteps,
  isSteppedSchema,
  shouldRenderField,
} from '../utils/state'
import { getSchemaContext, useFormContextResources } from './use-form-context-resources'
import { useFormFocus } from './use-form-focus'
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
  const navigationActionPending = ref<'next' | 'previous' | null>(null)

  setContext(getSchemaContext(params.schema.value))

  const apiFactory = (path: readonly string[], field?: FormField) =>
    createFieldApi({
      path,
      field,
      getValue: state.getValue,
      setValue: state.setValue,
      ctx: context,
      state: state.state,
      optionRegistry,
      focusField: () => focus.focusField(path),
      setExternalError: (message) => validation.setError(path, message),
      clearExternalError: () => validation.clearError(path),
      validateField: () =>
        field ? validation.validateFields([field], path.slice(0, -1)) : Promise.resolve(true),
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

  const focus = useFormFocus({
    getErrors: () => validation.errors.value,
  })

  async function validate(options?: FormValidationOptions) {
    const valid = await validation.validate()
    if (!valid && options?.focus) await focus.focusFirstInvalid()
    return valid
  }

  async function validateCurrentStep(options?: FormValidationOptions) {
    const valid = await validation.validateFields(
      currentFields.value,
      currentStepRoot.value ? [currentStepRoot.value] : [],
    )
    if (!valid && options?.focus) await focus.focusFirstInvalid()
    return valid
  }

  const submit = useFormSubmitController({
    validate: () => {
      validation.markAllTouched(collectFormFieldPaths(params.schema.value))
      return validate()
    },
    focusFirstInvalid: focus.focusFirstInvalid,
    getOutput: () => state.output.value,
    getApi: () => createPublicFormApi(runtime),
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
  const currentLayout = computed(() => {
    const schemaLayout = getSchemaLayout(params.schema.value)
    if (!isSteppedSchema(params.schema.value)) return resolveFormLayoutConfig(schemaLayout)

    return resolveFormLayoutConfig(
      schemaLayout,
      getSchemaSteps(params.schema.value)[currentStepIndex.value]?.layout,
    )
  })
  const steps = computed<readonly FormRuntimeStep[]>(() =>
    getSchemaSteps(params.schema.value).map((step, index) => ({
      key: step.key ?? String(index + 1),
      label:
        typeof step.title === 'function'
          ? String(step.title())
          : String(step.title ?? step.key ?? `Step ${index + 1}`),
      active: currentStepIndex.value === index,
      index,
      root: step.root,
    })),
  )
  const currentStep = computed(() => steps.value[currentStepIndex.value] ?? null)
  const isStepped = computed(() => isSteppedSchema(params.schema.value))
  const isFirstStep = computed(() => currentStepIndex.value <= 0)
  const isLastStep = computed(() => currentStepIndex.value >= steps.value.length - 1)
  const canGoPrevious = computed(() => isStepped.value && !isFirstStep.value)
  const canGoNext = computed(() => isStepped.value && !isLastStep.value)
  const actionPending = computed(() => navigationActionPending.value ?? submit.actionPending.value)

  async function runBeforeNext() {
    const handler = getSchemaLifecycleHandler(params.schema.value, 'onBeforeNext')
    if (!handler) return true

    try {
      const result = await withNavigationPending('next', () =>
        handler(createStepLifecycleParams(currentStepIndex.value)),
      )
      return result !== false
    } catch {
      return false
    }
  }

  async function runBeforePrevious() {
    const handler = getSchemaLifecycleHandler(params.schema.value, 'onBeforePrevious')
    if (!handler) return true

    try {
      await withNavigationPending('previous', () =>
        handler(createStepLifecycleParams(currentStepIndex.value)),
      )
      return true
    } catch {
      return false
    }
  }

  async function withNavigationPending<TValue>(
    action: 'next' | 'previous',
    callback: () => Promise<TValue> | TValue,
  ) {
    navigationActionPending.value = action
    try {
      return await callback()
    } finally {
      navigationActionPending.value = null
    }
  }

  function resolveNextStepIndex() {
    let targetIndex = currentStepIndex.value + 1
    const schemaSteps = getSchemaSteps(params.schema.value)

    while (targetIndex < schemaSteps.length && shouldSkipStep(targetIndex)) {
      notifyStepSkipped(targetIndex)
      targetIndex += 1
    }

    return targetIndex < schemaSteps.length ? targetIndex : null
  }

  function resolvePreviousStepIndex() {
    let targetIndex = currentStepIndex.value - 1

    while (targetIndex >= 0 && shouldSkipStep(targetIndex)) {
      notifyStepSkipped(targetIndex)
      targetIndex -= 1
    }

    return targetIndex >= 0 ? targetIndex : null
  }

  function shouldSkipStep(stepIndex: number) {
    const handler = getSchemaLifecycleHandler(params.schema.value, 'skipStep')
    return handler ? handler(createStepLifecycleParams(stepIndex)) === true : false
  }

  function notifyStepSkipped(stepIndex: number) {
    const handler = getSchemaLifecycleHandler(params.schema.value, 'onStepSkipped')
    handler?.(createStepLifecycleParams(stepIndex))
  }

  function createStepLifecycleParams(stepIndex: number) {
    return {
      step: getSchemaSteps(params.schema.value)[stepIndex],
      stepIndex,
      formData: state.output.value,
      stepData: state.output.value,
      api: createPublicFormApi(runtime),
    }
  }

  const runtime: FormRuntime = {
    schema: params.schema,
    state: state.state,
    output: state.output,
    dirtyPaths: state.dirtyPaths,
    isDirty: state.isDirty,
    errors: validation.errors,
    context,
    actionPending,
    currentStepIndex,
    currentFields,
    currentStepRoot,
    currentLayout,
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
    getFieldCallbackParams: (path, field) =>
      fieldCallbackParams({
        field,
        state: state.state,
        ctx: context,
        api: apiFactory(path, field),
        parentPath: path.slice(0, -1),
      }),
    registerFieldOptions: optionRegistry.register,
    refreshFieldOptions: optionRegistry.refreshMany,
    getFieldError: validation.getFieldError,
    markFieldTouched: validation.markTouched,
    isFieldTouched: validation.isTouched,
    shouldRender: (field, path) =>
      shouldRenderField(
        field,
        fieldCallbackParams({
          field,
          state: state.state,
          ctx: context,
          api: apiFactory(path, field),
          parentPath: path.slice(0, -1),
        }),
      ),
    validate,
    validateCurrentStep,
    focusRequest: focus.request,
    registerFieldElement: focus.registerField,
    focusField: focus.focusField,
    focusFirstInvalid: focus.focusFirstInvalid,
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
      validation.markAllTouched(
        collectFormFieldsPaths(
          currentFields.value,
          currentStepRoot.value ? [currentStepRoot.value] : [],
        ),
      )
      const valid = await validateCurrentStep({ focus: true })
      if (!valid) return false
      const canProceed = await runBeforeNext()
      if (!canProceed) return false

      const nextIndex = resolveNextStepIndex()
      if (nextIndex === null) return false
      currentStepIndex.value = nextIndex
      return true
    },
    previousStep: async () => {
      const canProceed = await runBeforePrevious()
      if (!canProceed) return false

      const previousIndex = resolvePreviousStepIndex()
      if (previousIndex === null) return false
      currentStepIndex.value = previousIndex
      return true
    },
    goToStep: async (index) => {
      const nextIndex = Math.min(Math.max(index, 0), steps.value.length - 1)
      if (nextIndex === currentStepIndex.value) return true
      if (nextIndex > currentStepIndex.value) {
        validation.markAllTouched(
          collectFormFieldsPaths(
            currentFields.value,
            currentStepRoot.value ? [currentStepRoot.value] : [],
          ),
        )
        const valid = await validateCurrentStep({ focus: true })
        if (!valid) return false
        const canProceed = await runBeforeNext()
        if (!canProceed) return false
      }

      currentStepIndex.value = nextIndex
      return true
    },
  }

  return runtime
}

function createFieldApi(params: {
  path: readonly string[]
  field?: FormField
  getValue: (path: string | readonly string[]) => unknown
  setValue: (path: string | readonly string[], value: unknown) => void
  ctx: FormRuntime['context']
  state: FormObject
  optionRegistry: ReturnType<typeof useFormOptionRegistry>
  focusField: () => Promise<boolean>
  setExternalError: (message: string) => void
  clearExternalError: () => void
  validateField: () => Promise<boolean>
}): FormFieldApi {
  const api: FormFieldApi<unknown, unknown, FormRuntime['context']> = {
    value: {
      get: () => params.getValue(params.path),
      set: (value) => params.setValue(params.path, value),
      reset: () => params.setValue(params.path, null),
    },
    options: {
      get: () => params.optionRegistry.get(params.path).items.value,
      pending: () => params.optionRegistry.get(params.path).pending.value,
      fetching: () => params.optionRegistry.get(params.path).fetching.value,
      loading: () => params.optionRegistry.get(params.path).loading.value,
      creating: () => params.optionRegistry.get(params.path).creating.value,
      refreshable: () => params.optionRegistry.get(params.path).refreshable.value,
      error: () => params.optionRegistry.get(params.path).error.value,
      refresh: () => params.optionRegistry.get(params.path).refresh(),
      add: (option) => params.optionRegistry.get(params.path).add(option),
      create: (label) => params.optionRegistry.get(params.path).create(label),
    },
    upload: {
      start: async () => {},
      cancel: async () => {},
      retry: async () => {},
      remove: async () => {},
    },
    context: {
      get: (key) => params.ctx[key],
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
        const refreshTasks = Object.values(params.ctx).map((resource) =>
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
    focus: params.focusField,
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
  return typeof value === 'object' && value !== null && 'value' in value
}

function isRefreshableResource(value: unknown): value is { refresh: () => Promise<void> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'refresh' in value &&
    typeof value.refresh === 'function'
  )
}

function getSchemaLifecycleHandler(schema: unknown, key: string) {
  if (!isRecord(schema)) return undefined
  const handler = Object.getOwnPropertyDescriptor(schema, key)?.value
  return typeof handler === 'function' ? handler : undefined
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
