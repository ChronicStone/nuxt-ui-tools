import { computed, ref, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { GenericObject } from '../../shared/types/utils'

import type {
  ExtractFormOutput,
  FormApi,
  FormContextData,
  FormObject,
  FormSubmitAction,
  FormSubmitHandler,
  FormSubmitHandlerResult,
  FormSubmitResult,
  FormSubmitTarget,
} from '../types'
import { isRecord } from '../utils/path'

export function useFormSubmit<const TSchema extends GenericObject, TSubmitData = unknown>(params: {
  formRef: Ref<FormSubmitTarget<ExtractFormOutput<TSchema>, TSubmitData> | null | undefined>
  schema: MaybeRefOrGetter<TSchema>
  onSubmit: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
}) {
  const isSubmitting = computed(() => params.formRef.value?.actionPending.value === 'submit')

  async function submit() {
    const form = params.formRef.value
    if (!form) return false
    const result = await form.submitHandler(params.onSubmit)
    return result.success
  }

  return {
    schema: computed(() => toValue(params.schema)),
    submit,
    isSubmitting,
  }
}

export function useFormSubmitController<TSubmitData = unknown>(params: {
  validate: () => Promise<boolean>
  getOutput: () => FormObject
  getApi: () => FormApi
  getSchema: () => unknown
  getContext: () => FormContextData
}) {
  const actionPending = ref<FormSubmitAction | null>(null)

  async function submitHandler(
    externalSubmitHandler?: FormSubmitHandler<FormObject, TSubmitData>,
  ): Promise<FormSubmitHandlerResult<TSubmitData>> {
    const isValid = await params.validate()
    if (!isValid) return { success: false }

    try {
      actionPending.value = 'submit'
      const beforeSubmit = getBeforeSubmit(params.getSchema())
      const beforeResult = await beforeSubmit?.({
        formData: params.getOutput(),
        api: params.getApi(),
      })
      if (isCancelled(beforeResult)) return { success: false }

      const schemaSubmit = getSchemaSubmit(params.getSchema())
      await schemaSubmit?.({
        value: params.getOutput(),
        api: params.getApi(),
        ctx: params.getContext(),
      })

      const result = await externalSubmitHandler?.({
        formData: params.getOutput(),
        api: params.getApi(),
      })
      return normalizeSubmitResult(result)
    } finally {
      actionPending.value = null
    }
  }

  return {
    actionPending: computed(() => actionPending.value),
    submitHandler,
  }
}

function normalizeSubmitResult<TSubmitData>(
  result: FormSubmitResult<TSubmitData> | undefined,
): FormSubmitHandlerResult<TSubmitData> {
  if (result === false) return { success: false }
  if (isRecord(result) && result.success === false) return { success: false }
  if (isRecord(result) && result.success === true) return { success: true, data: result.data }
  return { success: true }
}

function isCancelled(result: FormSubmitResult<never> | undefined) {
  return result === false || (isRecord(result) && result.success === false)
}

function getBeforeSubmit(schema: unknown): FormSubmitHandler<FormObject, never> | undefined {
  if (!isRecord(schema)) return undefined
  const handler = Object.getOwnPropertyDescriptor(schema, 'onBeforeSubmit')?.value
  return typeof handler === 'function' ? handler : undefined
}

function getSchemaSubmit(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const submit = Object.getOwnPropertyDescriptor(schema, 'submit')?.value
  return typeof submit === 'function' ? submit : undefined
}
