import { computed, inject, provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

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
  FormSubmitHandler,
} from '../types'
import { isRecord } from '../utils/path'

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
  const controllers = new Map<string, FormController<unknown, unknown>>()
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
  function createForm(schema: unknown, inputOrOptions?: unknown) {
    const options = resolveCreateOptions(inputOrOptions)
    const id = options.id ?? createInstanceId()

    return new Promise<FormApiCreateResult<FormObject, unknown>>((resolve) => {
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

  function setController(id: string, controller: FormController<unknown, unknown>) {
    controllers.set(id, controller)
  }

  function getController(id: string) {
    return controllers.get(id) ?? null
  }

  function removeController(id: string, controller: FormController<unknown, unknown>) {
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

function resolveCreateOptions(inputOrOptions: unknown): {
  id?: string
  input?: FormObject
  mode: FormApiDisplayModeInput
  onSubmit?: FormSubmitHandler<FormObject, unknown>
} {
  if (isCreateOptions(inputOrOptions)) {
    return {
      id: typeof inputOrOptions.id === 'string' ? inputOrOptions.id : undefined,
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

function isCreateOptions(value: unknown): value is {
  id?: unknown
  input?: unknown
  mode?: unknown
  onSubmit?: unknown
} {
  return (
    isRecord(value) &&
    ('input' in value ||
      'mode' in value ||
      'onSubmit' in value ||
      ('id' in value && ('input' in value || 'mode' in value || 'onSubmit' in value)))
  )
}

function resolveDisplayMode(value: unknown): FormApiDisplayModeInput {
  if (isDisplayModeInput(value)) return value
  return 'modal'
}

function isDisplayModeInput(value: unknown): value is FormApiDisplayModeInput {
  return typeof value === 'string' || typeof value === 'function'
}

function isSubmitHandler(value: unknown): value is FormSubmitHandler<FormObject, unknown> {
  return typeof value === 'function'
}

function getSchemaFormKey(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const formKey = Object.getOwnPropertyDescriptor(schema, 'formKey')?.value
  return typeof formKey === 'string' ? formKey : undefined
}

function resolveControllerOutput(controller: FormController<unknown, unknown> | undefined) {
  const output = controller?.output.value
  return isRecord(output) ? output : {}
}
