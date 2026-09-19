import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'

import type {
  FormValue,
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
import { isRecord, pathSegments } from '../utils/path'
import { isFunction, isObject, isUndefined } from '../utils/predicate'
import {
  childParentPath,
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
import { useFormUploadRegistry } from './use-form-upload-registry'
import { useFormValidation } from './use-form-validation'

const formRuntimeKey: InjectionKey<FormRuntime> = Symbol('nuxt-ui-tools-form-runtime')

export function provideFormRuntime(runtime: FormRuntime) {
  provide(formRuntimeKey, runtime)
}

export function useFormRuntimeContext() {
  const runtime = inject(formRuntimeKey)
  if (!runtime) {
    throw new Error('Form runtime is not provided.')
  }
  return runtime
}

export function useFormRuntime(params: UseFormRuntimeParams): FormRuntime {
  const { context, setContext } = useFormContextResources()
  const optionRegistry = useFormOptionRegistry()
  const uploadRegistry = useFormUploadRegistry()
  const currentStepIndex = ref<number>(0)
  const navigationActionPending = ref<'next' | 'previous' | null>(null)

  setContext(getSchemaContext(params.schema.value))

  function apiFactory(path: readonly string[], field?: FormField) {
    return createFieldApi({
      clearExternalError: () => validation.clearError(path),
      ctx: context,
      field,
      focusField: () => focus.focusField(path),
      getValue: state.getValue,
      optionRegistry,
      path,
      pendingField: () => validation.isPending(path),
      resetValue: state.resetValue,
      setExternalError: (message) => validation.setError(path, message),
      setValue: state.setValue,
      state: state.state,
      uploadRegistry,
      validateField: () =>
        field ? validation.validateFields([field], path.slice(0, -1)) : Promise.resolve(true),
    })
  }

  const state = useFormState({
    apiFactory,
    context,
    input: params.input,
    schema: params.schema,
  })

  const validation = useFormValidation({
    apiFactory,
    context,
    getValidationMode: () => params.validationMode?.value ?? true,
    schema: () => params.schema.value,
    state: state.state,
  })

  const focus = useFormFocus({
    getErrors: () => validation.validationErrors.value,
  })

  async function validate(options?: FormValidationOptions) {
    const valid = await validation.validate()
    if (!valid && options?.focus) {
      await focus.focusFirstInvalid()
    }
    return valid
  }

  async function validateCurrentStep(options?: FormValidationOptions) {
    const valid = await validation.validateFields(
      currentFields.value,
      currentStepRoot.value ? [currentStepRoot.value] : [],
    )
    if (!valid && options?.focus) {
      await focus.focusFirstInvalid()
    }
    return valid
  }

  const submit = useFormSubmitController({
    beforeNext: () => (isStepped.value ? runBeforeNext() : Promise.resolve(true)),
    focusFirstInvalid: focus.focusFirstInvalid,
    getApi: () => createPublicFormApi(runtime),
    getContext: () => context,
    getOutput: () => state.output.value,
    getSchema: () => params.schema.value,
    validate,
  })

  let hasInitializedInput = !isUndefined(params.input?.value)
  state.initialize(params.input?.value)

  if (params.input) {
    watch(
      params.input,
      (input) => {
        if (!hasInitializedInput && !isUndefined(input)) {
          hasInitializedInput = true
          state.initialize(input)
          return
        }

        state.syncInput(input, params.syncInput?.value ?? false)
      },
      { deep: true },
    )
  }

  watch(params.schema, (schema) => {
    currentStepIndex.value = 0
    validation.clearError()
    setContext(getSchemaContext(schema))
    state.initialize(params.input?.value)
  })

  const currentFields = computed(() => {
    if (!isSteppedSchema(params.schema.value)) {
      return getSchemaFields(params.schema.value)
    }
    return getSchemaSteps(params.schema.value)[currentStepIndex.value]?.fields ?? []
  })
  const currentStepRoot = computed(() => {
    if (!isSteppedSchema(params.schema.value)) {
      return undefined
    }
    return getSchemaSteps(params.schema.value)[currentStepIndex.value]?.root
  })
  const currentLayout = computed(() => {
    const schemaLayout = getSchemaLayout(params.schema.value)
    if (!isSteppedSchema(params.schema.value)) {
      return resolveFormLayoutConfig(schemaLayout)
    }

    return resolveFormLayoutConfig(
      schemaLayout,
      getSchemaSteps(params.schema.value)[currentStepIndex.value]?.layout,
    )
  })
  const steps = computed<readonly FormRuntimeStep[]>(() =>
    getSchemaSteps(params.schema.value).map((step, index) => ({
      active: currentStepIndex.value === index,
      index,
      key: step.key ?? String(index + 1),
      label: isFunction(step.title)
        ? String(step.title())
        : String(step.title ?? step.key ?? `Step ${index + 1}`),
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
    if (!handler) {
      return true
    }

    try {
      const result = await handler(createStepLifecycleParams(currentStepIndex.value))
      return result !== false
    } catch {
      return false
    }
  }

  async function runBeforePrevious() {
    const handler = getSchemaLifecycleHandler(params.schema.value, 'onBeforePrevious')
    if (!handler) {
      return true
    }

    try {
      await handler(createStepLifecycleParams(currentStepIndex.value))
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
      api: createPublicFormApi(runtime),
      formData: state.output.value,
      step: getSchemaSteps(params.schema.value)[stepIndex],
      stepData: state.output.value,
      stepIndex,
    }
  }

  const runtime: FormRuntime = {
    actionPending,
    canGoNext,
    canGoPrevious,
    clearError: (path) => validation.clearError(path ? pathSegments(path) : undefined),
    clearErrors: () => validation.clearError(),
    context,
    currentFields,
    currentLayout,
    currentStep,
    currentStepIndex,
    currentStepRoot,
    dirtyPaths: state.dirtyPaths,
    errors: validation.errors,
    focusField: focus.focusField,
    focusFirstInvalid: focus.focusFirstInvalid,
    focusRequest: focus.request,
    getFieldApi: apiFactory,
    getFieldCallbackParams: (path, field) =>
      fieldCallbackParams({
        api: apiFactory(path, field),
        ctx: context,
        field,
        parentPath: path.slice(0, -1),
        state: state.state,
      }),
    getFieldError: validation.getFieldError,
    getValue: state.getValue,
    goToStep: async (index) => {
      if (actionPending.value) return false
      const nextIndex = Math.min(Math.max(index, 0), steps.value.length - 1)
      if (nextIndex === currentStepIndex.value) return true
      if (nextIndex > currentStepIndex.value) {
        return withNavigationPending('next', async () => {
          const valid = await validateCurrentStep({ focus: true })
          if (!valid) return false
          const canProceed = await runBeforeNext()
          if (!canProceed) return false

          commitStepChange(nextIndex)
          return true
        })
      }

      commitStepChange(nextIndex)
      return true
    },
    isDirty: state.isDirty,
    isFieldTouched: validation.isTouched,
    isFirstStep,
    isLastStep,
    isStepped,
    markFieldTouched: validation.markTouched,
    nextStep: async () => {
      if (actionPending.value) return false
      return withNavigationPending('next', async () => {
        const valid = await validateCurrentStep({ focus: true })
        if (!valid) return false
        const canProceed = await runBeforeNext()
        if (!canProceed) return false

        const nextIndex = resolveNextStepIndex()
        if (nextIndex === null) return false
        commitStepChange(nextIndex)
        return true
      })
    },
    output: state.output,
    previousStep: async () => {
      if (actionPending.value) return false
      const handler = getSchemaLifecycleHandler(params.schema.value, 'onBeforePrevious')
      if (!handler) {
        const previousIndex = resolvePreviousStepIndex()
        if (previousIndex === null) return false
        commitStepChange(previousIndex)
        return true
      }

      return withNavigationPending('previous', async () => {
        const canProceed = await runBeforePrevious()
        if (!canProceed) return false

        const previousIndex = resolvePreviousStepIndex()
        if (previousIndex === null) return false
        commitStepChange(previousIndex)
        return true
      })
    },
    refreshFieldOptions: optionRegistry.refreshMany,
    registerFieldElement: focus.registerField,
    registerFieldOptions: optionRegistry.register,
    registerFieldUpload: uploadRegistry.register,
    reset: () => {
      validation.clearError()
      state.reset()
    },
    schema: params.schema,
    setError: (path, message) => validation.setError(pathSegments(path), message),
    setValue: state.setValue,
    shouldRender: (field, path) =>
      shouldRenderField(
        field,
        fieldCallbackParams({
          api: apiFactory(path, field),
          ctx: context,
          field,
          parentPath: path.slice(0, -1),
          state: state.state,
        }),
      ),
    state: state.state,
    steps,
    submit: async () => {
      const result = await submit.submitHandler()
      return result.success
    },
    submitHandler: submit.submitHandler,
    validate,
    validateCurrentStep,
  }

  function commitStepChange(index: number) {
    validation.clearValidationState()
    currentStepIndex.value = index
  }

  return runtime
}

function createFieldApi(params: {
  path: readonly string[]
  field?: FormField
  getValue: (path: string | readonly string[]) => FormValue
  setValue: (path: string | readonly string[], value: FormValue) => void
  resetValue: (path: string | readonly string[]) => void
  ctx: FormRuntime['context']
  state: FormObject
  optionRegistry: ReturnType<typeof useFormOptionRegistry>
  uploadRegistry: ReturnType<typeof useFormUploadRegistry>
  focusField: () => Promise<boolean>
  setExternalError: (message: string) => void
  clearExternalError: () => void
  validateField: () => Promise<boolean>
  pendingField: () => boolean
}): FormFieldApi {
  function contextResource(key: string) {
    const resource = params.ctx[key]
    if (!resource) {
      throw new Error(`Unknown form context resource: ${key}`)
    }
    return resource
  }

  const api: FormFieldApi<FormValue, FormValue, FormRuntime['context']> = {
    context: {
      get: (key) => contextResource(key),
      patch: (key, value) => patchContextResourceValue(contextResource(key), value),
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
      set: (key, value) => {
        contextResource(key).value = value
      },
      update: (key, updater) => {
        updateContextResourceValue(contextResource(key), updater)
      },
    },
    focus: params.focusField,
    options: {
      add: (option) => params.optionRegistry.get(params.path).add(option),
      create: (label) => params.optionRegistry.get(params.path).create(label),
      creating: () => params.optionRegistry.get(params.path).creating.value,
      error: () => params.optionRegistry.get(params.path).error.value,
      fetching: () => params.optionRegistry.get(params.path).fetching.value,
      get: () => params.optionRegistry.get(params.path).items.value,
      loading: () => params.optionRegistry.get(params.path).loading.value,
      pending: () => params.optionRegistry.get(params.path).pending.value,
      refresh: () => params.optionRegistry.get(params.path).refresh(),
      refreshable: () => params.optionRegistry.get(params.path).refreshable.value,
    },
    upload: {
      cancel: async () => await params.uploadRegistry.get(params.path)?.cancel(),
      remove: async (value) => await params.uploadRegistry.get(params.path)?.remove(value),
      retry: async () => await params.uploadRegistry.get(params.path)?.retry(),
      start: async () => await params.uploadRegistry.get(params.path)?.start(),
    },
    validation: {
      clearError: params.clearExternalError,
      pending: params.pendingField,
      setError: params.setExternalError,
      validate: params.validateField,
    },
    value: {
      get: () => params.getValue(params.path),
      reset: () => params.resetValue(params.path),
      set: (value) => params.setValue(params.path, value),
    },
  }

  return api
}

function updateContextResourceValue<TResource extends { value: FormValue }>(
  resource: TResource,
  updater: (value: TResource['value']) => TResource['value'],
) {
  resource.value = updater(resource.value)
}

function patchContextResourceValue(resource: FormValue, patch: FormValue) {
  if (!isContextValueResource(resource)) {
    return
  }

  const current = resource.value
  const patchValue = isFunction(patch) ? patch(current) : patch
  if (isRecord(current) && isRecord(patchValue)) {
    resource.value = { ...current, ...patchValue }
    return
  }

  resource.value = patchValue
}

function isContextValueResource(value: FormValue): value is { value: FormValue } {
  return isObject(value) && value !== null && 'value' in value
}

function isRefreshableResource(value: FormValue): value is { refresh: () => Promise<void> } {
  return isObject(value) && value !== null && 'refresh' in value && isFunction(value.refresh)
}

function getSchemaLifecycleHandler(schema: FormValue, key: string) {
  if (!isRecord(schema)) {
    return undefined
  }
  const handler = Object.getOwnPropertyDescriptor(schema, key)?.value
  return isFunction(handler) ? handler : undefined
}

function fieldCallbackParams(params: {
  field: FormField
  state: FormObject
  ctx: FormRuntime['context']
  api: FormFieldApi
  parentPath: readonly string[]
}): FormFieldCallbackParams {
  return {
    api: params.api,
    ctx: params.ctx,
    deps: resolveFieldDependencies(params),
  }
}

export { childParentPath, fieldPath }
