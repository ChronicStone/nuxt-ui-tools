import { computed, onBeforeUnmount, ref } from 'vue'

import type {
  FormValue,
  FormApiRuntimeInstance,
  FormObject,
  FormOverlayResolution,
  FormSubmitHandlerResult,
} from '../types'
import { getFormOverlayDescription, getFormOverlayTitle } from '../utils/overlay'
import { isRecord } from '../utils/path'
import { useForm } from './use-form'
import { useFormApi } from './use-form-api'
import { useFormRuntime } from './use-form-runtime'

export function useFormOverlayController(instance: FormApiRuntimeInstance) {
  const formApi = useFormApi()
  const form = useForm({
    input: computed(() => instance.input),
    onSubmit: instance.onSubmit,
    schema: computed(() => instance.schema),
  })
  const open = ref<boolean>(true)
  const pendingResolution = ref<FormOverlayResolution | null>(null)
  const title = computed(() => getFormOverlayTitle(instance.schema))
  const description = computed(
    () =>
      getFormOverlayDescription(instance.schema) ?? getFormOverlayTitle(instance.schema) ?? 'Form',
  )
  const dismissible = computed(() => !form.isSubmitting.value)

  // The runtime owns the values, so it lives with the controller and not with the layout that
  // renders it: switching between modal, drawer and fullscreen must not rebuild the state.
  const runtime = useFormRuntime({
    input: form.input,
    schema: form.schema,
    syncInput: form.syncInput,
    validationMode: form.validationMode,
  })
  form.bind(runtime)

  formApi.setController(instance.id, form)

  const runtimeControls = {
    close: requestCancel,
    submit: submitOverlay,
  }

  formApi.setRuntimeControls(instance.id, runtimeControls)

  onBeforeUnmount(() => {
    form.unbind(runtime)
    formApi.removeController(instance.id, form)
    formApi.removeRuntimeControls(instance.id, runtimeControls)
  })

  function handleSubmitted(formData: FormObject, result: FormSubmitHandlerResult<FormValue>) {
    requestComplete(formData, result.data)
  }

  function handleCancelled() {
    requestCancel()
  }

  async function submitOverlay() {
    const result = await form.submitHandler()
    if (!result.success) {
      return false
    }

    requestComplete(resolveCurrentOutput(), result.data)
    return true
  }

  function handleOpenUpdate(value: boolean) {
    if (value) {
      open.value = true
      return
    }

    requestCancel()
  }

  function requestComplete(formData: FormObject, submitData?: FormValue) {
    closeWithResolution({ formData, submitData, type: 'complete' })
  }

  function requestCancel() {
    closeWithResolution({ formData: resolveCurrentOutput(), type: 'cancel' })
  }

  function closeWithResolution(resolution: FormOverlayResolution) {
    if (pendingResolution.value) {
      return
    }

    pendingResolution.value = resolution
    open.value = false
  }

  function resolveAfterClose() {
    const resolution = pendingResolution.value
    if (!resolution) {
      return
    }

    pendingResolution.value = null

    if (resolution.type === 'complete') {
      instance.complete(resolution.formData, resolution.submitData)
      return
    }

    instance.cancel(resolution.formData)
  }

  function resolveCurrentOutput() {
    return isRecord(form.output.value) ? form.output.value : {}
  }

  return {
    description,
    dismissible,
    form,
    handleCancelled,
    handleOpenUpdate,
    handleSubmitted,
    open,
    resolveAfterClose,
    runtime,
    title,
  }
}
