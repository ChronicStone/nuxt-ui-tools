import { computed, shallowRef, toValue } from 'vue'

import type {
  FormController,
  FormObject,
  FormSubmitAction,
  FormSubmitHandler,
  FormSubmitHandlerResult,
  RuntimeUseFormParams,
  UseFormParams,
  FormRuntime,
  FormValidationOptions,
  FormValidationMode,
} from '../types'
import { isRecord } from '../utils/path'

export function useForm<const TSchema, TSubmitData = unknown>(
  params: UseFormParams<TSchema, TSubmitData>,
): FormController<TSchema, TSubmitData>
export function useForm(params: RuntimeUseFormParams) {
  const runtime = shallowRef<FormRuntime | null>(null)
  const schema = computed(() => toValue(params.schema))
  const input = computed(() => (params.input ? toValue(params.input) : undefined))
  const syncInput = computed<boolean | readonly string[]>(() =>
    typeof params.syncInput !== 'undefined'
      ? toValue(params.syncInput)
      : getSchemaSyncInput(schema.value),
  )
  const validationMode = computed<FormValidationMode>(() =>
    typeof params.validate !== 'undefined'
      ? toValue(params.validate)
      : getSchemaValidationMode(schema.value),
  )
  const isBound = computed(() => runtime.value !== null)
  const context = computed(() => runtime.value?.context ?? {})
  const internal = computed(() => runtime.value?.state ?? {})
  const output = computed(() => runtime.value?.output.value ?? {})
  const errors = computed(() => runtime.value?.errors.value ?? [])
  const hasErrors = computed(() => errors.value.length > 0)
  const isValid = computed(() => !hasErrors.value)
  const dirtyPaths = computed(() => runtime.value?.dirtyPaths.value ?? [])
  const isDirty = computed(() => runtime.value?.isDirty.value ?? false)
  const actionPending = computed<FormSubmitAction | null>(
    () => runtime.value?.actionPending.value ?? null,
  )
  const isSubmitting = computed(() => actionPending.value === 'submit')
  const currentStepIndex = computed(() => runtime.value?.currentStepIndex.value ?? 0)
  const currentStep = computed(() => runtime.value?.currentStep.value ?? null)
  const steps = computed(() => runtime.value?.steps.value ?? [])
  const isStepped = computed(() => runtime.value?.isStepped.value ?? false)
  const isFirstStep = computed(() => runtime.value?.isFirstStep.value ?? true)
  const isLastStep = computed(() => runtime.value?.isLastStep.value ?? true)
  const canGoPrevious = computed(() => runtime.value?.canGoPrevious.value ?? false)
  const canGoNext = computed(() => runtime.value?.canGoNext.value ?? false)

  async function submitHandler(
    externalSubmitHandler?: FormSubmitHandler<FormObject, unknown>,
  ): Promise<FormSubmitHandlerResult<unknown>> {
    const current = runtime.value
    if (!current) return { success: false }
    return await current.submitHandler(externalSubmitHandler ?? params.onSubmit)
  }

  async function submit(externalSubmitHandler?: FormSubmitHandler<FormObject, unknown>) {
    const result = await submitHandler(externalSubmitHandler)
    return result.success
  }

  async function validate(options?: FormValidationOptions) {
    return (await runtime.value?.validate(options)) ?? false
  }

  async function validateCurrentStep(options?: FormValidationOptions) {
    return (await runtime.value?.validateCurrentStep(options)) ?? false
  }

  async function focus(path: string | readonly string[]) {
    return (await runtime.value?.focusField(path)) ?? false
  }

  async function focusFirstInvalid() {
    return (await runtime.value?.focusFirstInvalid()) ?? false
  }

  function getError(path: string) {
    return errors.value.find((error) => error.path === path)?.message
  }

  function clearErrors() {
    runtime.value?.clearErrors()
  }

  function reset() {
    runtime.value?.reset()
  }

  async function nextStep() {
    return (await runtime.value?.nextStep()) ?? false
  }

  async function previousStep() {
    return (await runtime.value?.previousStep()) ?? false
  }

  async function goToStep(index: number) {
    return (await runtime.value?.goToStep(index)) ?? false
  }

  function bind(nextRuntime: FormRuntime) {
    runtime.value = nextRuntime
  }

  function unbind(previousRuntime: FormRuntime) {
    if (runtime.value === previousRuntime) runtime.value = null
  }

  const state = {
    internal,
    output,
    get: (path: string) => runtime.value?.getValue(path),
    set: (path: string, value: unknown) => runtime.value?.setValue(path, value),
    reset,
  }
  const meta = {
    isBound,
    isDirty,
    dirtyPaths,
  }
  const validation = {
    errors,
    hasErrors,
    isValid,
    validate,
    validateCurrentStep,
    focusFirstInvalid,
    getError,
    clear: clearErrors,
  }
  const submission = {
    actionPending,
    isSubmitting,
    submit,
    submitHandler,
  }
  const navigation = {
    currentStepIndex,
    currentStep,
    steps,
    isStepped,
    isFirstStep,
    isLastStep,
    canGoPrevious,
    canGoNext,
    next: nextStep,
    previous: previousStep,
    goTo: goToStep,
  }

  return {
    schema,
    input,
    syncInput,
    validationMode,
    context,
    state,
    meta,
    validation,
    submission,
    navigation,
    internal,
    output,
    errors,
    dirtyPaths,
    isDirty,
    actionPending,
    isSubmitting,
    validate,
    focus,
    submit,
    submitHandler,
    reset,
    nextStep,
    previousStep,
    bind,
    unbind,
  }
}

function getSchemaSyncInput(schema: unknown): boolean | readonly string[] {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'syncInput')?.value : undefined
  if (typeof value === 'boolean') return value
  return Array.isArray(value) ? value.filter((path) => typeof path === 'string') : false
}

function getSchemaValidationMode(schema: unknown): FormValidationMode {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'validate')?.value : undefined
  return value === false || value === 'required' || value === 'rules' ? value : true
}

function getSchemaControls(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const controls = Object.getOwnPropertyDescriptor(schema, 'controls')?.value
  return isRecord(controls) ? controls : undefined
}
