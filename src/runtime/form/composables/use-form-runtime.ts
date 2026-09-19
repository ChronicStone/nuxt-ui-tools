import { computed, inject, nextTick, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type {
  FormValue,
  FormErrorOptions,
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
import {
  getPathValue,
  isRecord,
  pathSegments,
  relativePathSegments,
  setPathValue,
} from '../utils/path'
import { isFunction, isObject, isPromise, isUndefined, stringArray } from '../utils/predicate'
import {
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
export { childParentPath, fieldPath } from '../utils/state'

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
  const navigationActionPending = ref<'next' | 'previous' | 'reset' | null>(null)
  const effects = createEffectLifecycle()
  const { t } = useUiToolsLocale()

  setContext(getSchemaContext(params.schema.value))

  function createFormNamespace(
    path: readonly string[],
    read: {
      getValue: (target: readonly string[]) => FormValue
      getInitialValue: (target: readonly string[]) => FormValue
      setValue: (target: readonly string[], value: FormValue) => void
      state: () => FormObject
    },
  ): FormFieldApi['form'] {
    const parentPath = path.slice(0, -1)
    function resolve(target: string) {
      return resolveRelativeFieldPath(parentPath, target)
    }
    return {
      clearError: (target) => runtime.clearError(target ? resolve(target) : undefined),
      focus: (target) => runtime.focusField(resolve(target)),
      get: (target) => read.getValue(resolve(target)),
      initial: (target) => read.getInitialValue(resolve(target)),
      nextStep: () => runtime.nextStep(),
      output: () => runtime.output.value,
      previousStep: () => runtime.previousStep(),
      reset: () => runtime.reset(),
      set: (target, value) => read.setValue(resolve(target), value),
      setError: (target, message, options) => runtime.setError(resolve(target), message, options),
      state: () => read.state(),
      submit: () => runtime.submit(),
      validate: () => runtime.validate(),
    }
  }

  function createApiFactory(read: {
    getValue: (target: readonly string[]) => FormValue
    getInitialValue: (target: readonly string[]) => FormValue
    setValue: (target: readonly string[], value: FormValue) => void
    state: () => FormObject
  }) {
    return (path: readonly string[], field?: FormField) =>
      createFieldApi({
        clearExternalError: () => validation.clearError(path),
        ctx: context,
        field,
        focusField: () => focus.focusField(path),
        form: createFormNamespace(path, read),
        getInitialValue: read.getInitialValue,
        getValue: read.getValue,
        optionRegistry,
        path,
        pendingField: () => validation.isPending(path),
        resetValue: state.resetValue,
        setExternalError: (message, options) => validation.setError(path, message, options),
        setValue: read.setValue,
        state: read.state(),
        uploadRegistry,
        validateField: () =>
          field ? validation.validateFields([field], path.slice(0, -1)) : Promise.resolve(true),
      })
  }

  const apiFactory = createApiFactory({
    getInitialValue: (target) => state.getInitialValue(target),
    getValue: (target) => state.getValue(target),
    setValue: (target, value) => state.setValue(target, value),
    state: () => state.state,
  })

  const state = useFormState({
    apiFactory,
    bootstrapApiFactory: (draft, initial) =>
      createApiFactory({
        getInitialValue: (target) => getPathValue(initial, target),
        getValue: (target) => getPathValue(draft, target),
        setValue: (target, value) => setPathValueOf(draft, target, value),
        state: () => draft,
      }),
    context,
    ignoreDirtyPaths: () => getSchemaIgnoredDirtyPaths(params.schema.value),
    input: params.input,
    schema: params.schema,
  })

  const validation = useFormValidation({
    apiFactory,
    context,
    getRequiredMessage: () => t('form.validation.required'),
    getUniqueMessage: () => t('form.fields.array.unique'),
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

  let pendingInput: FormObject | undefined
  if (params.input) {
    watch(
      params.input,
      (input) => {
        if (!hasInitializedInput && !isUndefined(input)) {
          hasInitializedInput = true
          state.initialize(input)
          return
        }

        const paths = params.syncInput?.value ?? false
        if (isSyncEnabled(paths)) {
          pendingInput = undefined
          state.syncInput(input, paths)
          return
        }
        pendingInput = input
      },
      { deep: true },
    )
  }
  if (params.syncInput) {
    watch(params.syncInput, (paths) => {
      if (!isSyncEnabled(paths) || isUndefined(pendingInput)) {
        return
      }
      state.syncInput(pendingInput, paths)
      pendingInput = undefined
    })
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
      return
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
    getInitialValue: state.getInitialValue,
    getValue: state.getValue,
    goToStep: async (index) => {
      if (actionPending.value) {
        return false
      }
      const nextIndex = Math.min(Math.max(index, 0), steps.value.length - 1)
      if (nextIndex === currentStepIndex.value) {
        return true
      }
      if (nextIndex > currentStepIndex.value) {
        const valid = await withNavigationPending('next', () => validateCurrentStep())
        if (!valid) {
          await focus.focusFirstInvalid()
          return false
        }
        return withNavigationPending('next', async () => {
          const canProceed = await runBeforeNext()
          if (!canProceed) {
            return false
          }

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
      if (actionPending.value) {
        return false
      }
      const valid = await withNavigationPending('next', () => validateCurrentStep())
      if (!valid) {
        await focus.focusFirstInvalid()
        return false
      }
      return withNavigationPending('next', async () => {
        const canProceed = await runBeforeNext()
        if (!canProceed) {
          return false
        }

        const nextIndex = resolveNextStepIndex()
        if (nextIndex === null) {
          return false
        }
        commitStepChange(nextIndex)
        return true
      })
    },
    output: state.output,
    previousStep: async () => {
      if (actionPending.value) {
        return false
      }
      const handler = getSchemaLifecycleHandler(params.schema.value, 'onBeforePrevious')
      if (!handler) {
        const previousIndex = resolvePreviousStepIndex()
        if (previousIndex === null) {
          return false
        }
        commitStepChange(previousIndex)
        return true
      }

      return withNavigationPending('previous', async () => {
        const canProceed = await runBeforePrevious()
        if (!canProceed) {
          return false
        }

        const previousIndex = resolvePreviousStepIndex()
        if (previousIndex === null) {
          return false
        }
        commitStepChange(previousIndex)
        return true
      })
    },
    refreshFieldOptions: optionRegistry.refreshMany,
    registerFieldElement: focus.registerField,
    registerFieldOptions: optionRegistry.register,
    registerFieldUpload: uploadRegistry.register,
    reset: async () => {
      if (navigationActionPending.value === 'reset') {
        await effects.settle()
        return
      }
      navigationActionPending.value = 'reset'
      try {
        validation.clearError()
        state.reset()
        await settleEffectRounds()
        state.rebaseline()
      } finally {
        navigationActionPending.value = null
      }
    },
    schema: params.schema,
    setError: (path, message, options) => validation.setError(pathSegments(path), message, options),
    settleEffects: settleEffectRounds,
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
    trackEffect: effects.track,
    validate,
    validateCurrentStep,
  }

  async function settleEffectRounds() {
    for (let round = 0; round < MAX_EFFECT_ROUNDS; round += 1) {
      // oxlint-disable-next-line no-await-in-loop -- each round must observe the previous round's writes
      await nextTick()
      if (!effects.size()) {
        return
      }
      // oxlint-disable-next-line no-await-in-loop -- each round must observe the previous round's writes
      await effects.settle()
    }
  }

  function commitStepChange(index: number) {
    validation.clearValidationState()
    currentStepIndex.value = index
  }

  return runtime
}

const MAX_EFFECT_ROUNDS = 25

function isSyncEnabled(paths: boolean | readonly string[]) {
  return paths === true || (Array.isArray(paths) && paths.length > 0)
}

function createEffectLifecycle() {
  const pending = new Set<Promise<FormValue>>()

  function track(effect: FormValue) {
    if (!isPromise(effect)) {
      return
    }
    const tracked: Promise<FormValue> = effect
    pending.add(tracked)
    void untrack(tracked)
  }

  async function untrack(tracked: Promise<FormValue>) {
    try {
      await tracked
    } catch {
      pending.delete(tracked)
      return
    }
    pending.delete(tracked)
  }

  async function settle() {
    while (pending.size) {
      // oxlint-disable-next-line no-await-in-loop -- effects settled in one round may enqueue more
      await Promise.allSettled(pending)
    }
  }

  return { settle, size: () => pending.size, track }
}

function resolveRelativeFieldPath(parentPath: readonly string[], target: string) {
  if (target === '$root') {
    return []
  }
  if (target.startsWith('$parent')) {
    return relativePathSegments(parentPath, target)
  }
  return pathSegments(target)
}

function setPathValueOf(target: FormObject, path: readonly string[], value: FormValue) {
  setPathValue(target, path, value)
}

function getSchemaIgnoredDirtyPaths(schema: FormValue) {
  if (!isRecord(schema) || !isRecord(schema.controls)) {
    return []
  }
  return stringArray(schema.controls.ignoreDirtyPaths)
}

function createFieldApi(params: {
  path: readonly string[]
  field?: FormField
  form: FormFieldApi['form']
  getValue: (path: readonly string[]) => FormValue
  getInitialValue: (path: readonly string[]) => FormValue
  setValue: (path: readonly string[], value: FormValue) => void
  resetValue: (path: string | readonly string[]) => void
  ctx: FormRuntime['context']
  state: FormObject
  optionRegistry: ReturnType<typeof useFormOptionRegistry>
  uploadRegistry: ReturnType<typeof useFormUploadRegistry>
  focusField: () => Promise<boolean>
  setExternalError: (message: string, options?: FormErrorOptions) => void
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
        if (isRefreshableResource(resource)) {
          await resource.refresh()
        }
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
    form: params.form,
    options: {
      add: (option) => params.optionRegistry.get(params.path).add(option),
      create: (label) => params.optionRegistry.get(params.path).create(label),
      activate: () => params.optionRegistry.get(params.path).activate(),
      creating: () => params.optionRegistry.get(params.path).creating.value,
      error: () => params.optionRegistry.get(params.path).error.value,
      fetching: () => params.optionRegistry.get(params.path).fetching.value,
      get: () => params.optionRegistry.get(params.path).items.value,
      hasMore: () => params.optionRegistry.get(params.path).hasMore.value,
      loadMore: () => params.optionRegistry.get(params.path).loadMore(),
      loading: () => params.optionRegistry.get(params.path).loading.value,
      pending: () => params.optionRegistry.get(params.path).pending.value,
      refresh: () => params.optionRegistry.get(params.path).refresh(),
      refreshable: () => params.optionRegistry.get(params.path).refreshable.value,
      remote: () => params.optionRegistry.get(params.path).remote.value,
      retry: () => params.optionRegistry.get(params.path).retry(),
      search: () => params.optionRegistry.get(params.path).search.value,
      selected: () => params.optionRegistry.get(params.path).selectedItems.value,
      setSearch: (term) => params.optionRegistry.get(params.path).setSearch(term),
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
      initial: () => params.getInitialValue(params.path),
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
    return
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
