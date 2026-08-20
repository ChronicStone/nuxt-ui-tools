import { computed, onBeforeUnmount, ref } from 'vue'

import type { FormValue } from '../types'
import type {
  FormApiRuntimeInstance,
  FormObject,
  FormOverlayResolution,
  FormSubmitHandlerResult,
} from '../types'
import { getFormOverlayDescription, getFormOverlayTitle } from '../utils/overlay'
import { isRecord } from '../utils/path'
import { useForm } from './use-form'
import { useFormApi } from './use-form-api'

export function useFormOverlayController(instance: FormApiRuntimeInstance) {
  const formApi = useFormApi()
  const form = useForm({
    schema: computed(() => instance.schema),
    input: computed(() => instance.input),
    onSubmit: instance.onSubmit,
  })
  const open = ref<boolean>(true)
  const pendingResolution = ref<FormOverlayResolution | null>(null)
  const title = computed(() => getFormOverlayTitle(instance.schema))
  const description = computed(
    () =>
      getFormOverlayDescription(instance.schema) ?? getFormOverlayTitle(instance.schema) ?? 'Form',
  )
  const dismissible = computed(() => !form.isSubmitting.value)

  formApi.setController(instance.id, form)

  const runtimeControls = {
    close: requestCancel,
    submit: submitOverlay,
  }

  formApi.setRuntimeControls(instance.id, runtimeControls)

  onBeforeUnmount(() => {
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
    if (!result.success) return false

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
    closeWithResolution({ type: 'complete', formData, submitData })
  }

  function requestCancel() {
    closeWithResolution({ type: 'cancel', formData: resolveCurrentOutput() })
  }

  function closeWithResolution(resolution: FormOverlayResolution) {
    if (pendingResolution.value) return

    pendingResolution.value = resolution
    open.value = false
  }

  function resolveAfterClose() {
    const resolution = pendingResolution.value
    if (!resolution) return

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
    form,
    open,
    title,
    description,
    dismissible,
    handleOpenUpdate,
    handleSubmitted,
    handleCancelled,
    resolveAfterClose,
  }
}
