import { computed, inject, provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

import type { FormValue } from '../types'
import type {
  ExtractFormOutput,
  FormApiController,
  FormApiCreateBaseOptions,
  FormApiCreateOptions,
  FormApiCreateResult,
  FormApiDisplayModeInput,
  FormApiRuntimeControls,
  FormApiRuntimeInstance,
  FormController,
  FormObject,
  FormResolvedCreateOptions,
  FormSubmitHandler,
} from '../types'
import { isRecord } from '../utils/path'
import { isFunction, isString } from '../utils/predicate'

const formApiKey: InjectionKey<FormApiController> = Symbol('nuxt-ui-tools-form-api')

export function provideFormApi() {
  const api = createFormApi()
  provide(formApiKey, api)
  return api
}

export function useFormApi() {
  const api = inject(formApiKey)
  if (!api) throw new Error('Form API is not provided. Wrap your app with <NutFormProvider>.')
  return api
}

function createFormApi(): FormApiController {
  const formInstances = ref<readonly FormApiRuntimeInstance[]>([])
  const controllers = new Map<string, FormController<FormValue, FormValue>>()
  const runtimeControls = new Map<string, FormApiRuntimeControls>()
  let nextInstanceIndex = 0

  function createForm<const TSchema>(
    schema: TSchema,
  ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>>>
  function createForm<const TSchema, TSubmitData>(
    schema: TSchema,
    options: FormApiCreateBaseOptions & {
      onSubmit: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
    },
  ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>, TSubmitData>>
  function createForm<const TSchema>(
    schema: TSchema,
    input: FormObject,
  ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>>>
  function createForm<const TSchema, TSubmitData = undefined>(
    schema: TSchema,
    options: FormApiCreateOptions<TSchema, TSubmitData>,
  ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>, TSubmitData>>
  function createForm(schema: FormValue, inputOrOptions?: FormValue) {
    const options = resolveCreateOptions(inputOrOptions)
    const id = options.id ?? createInstanceId()

    return new Promise<FormApiCreateResult<FormObject, FormValue>>((resolve) => {
      const instance: FormApiRuntimeInstance = {
        id,
        schema,
        input: options.input,
        mode: options.mode,
        onSubmit: options.onSubmit,
        complete: (formData, submitData) => {
          removeInstance(id)
          resolve({ isCompleted: true, formData, submitData })
        },
        cancel: (formData) => {
          removeInstance(id)
          resolve({ isCompleted: false, formData })
        },
      }

      formInstances.value = [...formInstances.value, instance]
    })
  }

  function getForm(idOrFormKey: string) {
    return (
      formInstances.value.find(
        (instance) =>
          instance.id === idOrFormKey || getSchemaFormKey(instance.schema) === idOrFormKey,
      ) ?? null
    )
  }

  function isOpen(idOrFormKey: string) {
    return getForm(idOrFormKey) !== null
  }

  function closeForm(idOrFormKey: string) {
    const instance = getForm(idOrFormKey)
    if (!instance) return false

    const controls = runtimeControls.get(instance.id)
    if (controls) {
      controls.close()
      return true
    }

    const controller = controllers.get(instance.id)
    instance.cancel(resolveControllerOutput(controller))
    return true
  }

  async function submitForm(idOrFormKey: string) {
    const instance = getForm(idOrFormKey)
    if (!instance) return false

    const controls = runtimeControls.get(instance.id)
    if (controls) return await controls.submit()

    const controller = controllers.get(instance.id)
    return (await controller?.submit()) ?? false
  }

  function destroyAll() {
    for (const instance of formInstances.value) {
      const controls = runtimeControls.get(instance.id)
      if (controls) {
        controls.close()
        continue
      }

      const controller = controllers.get(instance.id)
      instance.cancel(resolveControllerOutput(controller))
    }
  }

  function setController(id: string, controller: FormController<FormValue, FormValue>) {
    controllers.set(id, controller)
  }

  function getController(id: string) {
    return controllers.get(id) ?? null
  }

  function removeController(id: string, controller: FormController<FormValue, FormValue>) {
    if (controllers.get(id) === controller) controllers.delete(id)
  }

  function setRuntimeControls(id: string, controls: FormApiRuntimeControls) {
    runtimeControls.set(id, controls)
  }

  function removeRuntimeControls(id: string, controls: FormApiRuntimeControls) {
    if (runtimeControls.get(id) === controls) runtimeControls.delete(id)
  }

  function removeInstance(id: string) {
    formInstances.value = formInstances.value.filter((instance) => instance.id !== id)
    controllers.delete(id)
    runtimeControls.delete(id)
  }

  function createInstanceId() {
    nextInstanceIndex += 1
    return `form_${nextInstanceIndex}`
  }

  return {
    formInstances: computed(() => formInstances.value),
    createForm,
    getForm,
    isOpen,
    closeForm,
    submitForm,
    destroyAll,
    getController,
    setController,
    removeController,
    setRuntimeControls,
    removeRuntimeControls,
  }
}

function resolveCreateOptions(inputOrOptions: FormValue): FormResolvedCreateOptions {
  if (isCreateOptions(inputOrOptions)) {
    return {
      id: isString(inputOrOptions.id) ? inputOrOptions.id : undefined,
      input: isRecord(inputOrOptions.input) ? inputOrOptions.input : undefined,
      mode: resolveDisplayMode(inputOrOptions.mode),
      onSubmit: isSubmitHandler(inputOrOptions.onSubmit) ? inputOrOptions.onSubmit : undefined,
    }
  }

  return {
    input: isRecord(inputOrOptions) ? inputOrOptions : undefined,
    mode: 'modal',
  }
}

function isCreateOptions(value: FormValue): value is {
  id?: FormValue
  input?: FormValue
  mode?: FormValue
  onSubmit?: FormValue
} {
  return (
    isRecord(value) &&
    ('input' in value ||
      'mode' in value ||
      'onSubmit' in value ||
      ('id' in value && ('input' in value || 'mode' in value || 'onSubmit' in value)))
  )
}

function resolveDisplayMode(value: FormValue): FormApiDisplayModeInput {
  if (isDisplayModeInput(value)) return value
  return 'modal'
}

function isDisplayModeInput(value: FormValue): value is FormApiDisplayModeInput {
  return isString(value) || isFunction(value)
}

function isSubmitHandler(value: FormValue): value is FormSubmitHandler<FormObject, FormValue> {
  return isFunction(value)
}

function getSchemaFormKey(schema: FormValue) {
  if (!isRecord(schema)) return undefined
  const formKey = Object.getOwnPropertyDescriptor(schema, 'formKey')?.value
  return isString(formKey) ? formKey : undefined
}

function resolveControllerOutput(controller: FormController<FormValue, FormValue> | undefined) {
  const output = controller?.output.value
  return isRecord(output) ? output : {}
}
