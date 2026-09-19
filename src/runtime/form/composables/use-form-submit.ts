import { computed, ref, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'

import type { GenericObject } from '../../shared/types/utils'
import type {
  FormValue,
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
import { isFunction } from '../utils/predicate'

export function useFormSubmit<
  const TSchema extends GenericObject,
  TSubmitData = FormValue,
>(params: {
  formRef: Ref<FormSubmitTarget<ExtractFormOutput<TSchema>, TSubmitData> | null | undefined>
  schema: MaybeRefOrGetter<TSchema>
  onSubmit: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
}) {
  const isSubmitting = computed(() => params.formRef.value?.actionPending.value === 'submit')

  async function submit() {
    const form = params.formRef.value
    if (!form) {
      return false
    }
    const result = await form.submitHandler(params.onSubmit)
    return result.success
  }

  return {
    isSubmitting,
    schema: computed(() => toValue(params.schema)),
    submit,
  }
}

export function useFormSubmitController<TSubmitData = FormValue>(params: {
  validate: () => Promise<boolean>
  beforeNext?: () => Promise<boolean>
  focusFirstInvalid?: () => Promise<boolean>
  getOutput: () => FormObject
  getApi: () => FormApi
  getSchema: () => FormValue
  getContext: () => FormContextData
}) {
  const actionPending = ref<FormSubmitAction | null>(null)

  async function submitHandler(
    externalSubmitHandler?: FormSubmitHandler<FormObject, TSubmitData>,
  ): Promise<FormSubmitHandlerResult<TSubmitData>> {
    if (actionPending.value) {
      return { success: false }
    }

    actionPending.value = 'submit'
    try {
      const isValid = await params.validate()
      if (!isValid) {
        await params.focusFirstInvalid?.()
        return { success: false }
      }

      if (params.beforeNext) {
        actionPending.value = 'next'
        try {
          const beforeNextResult = await params.beforeNext()
          if (!beforeNextResult) {
            return { success: false }
          }
        } finally {
          actionPending.value = 'submit'
        }
      }

      const beforeSubmit = getBeforeSubmit(params.getSchema())
      const beforeResult = await beforeSubmit?.({
        api: params.getApi(),
        formData: params.getOutput(),
      })
      if (isCancelled(beforeResult)) {
        return { success: false }
      }

      const schemaSubmit = getSchemaSubmit(params.getSchema())
      await schemaSubmit?.({
        api: params.getApi(),
        ctx: params.getContext(),
        value: params.getOutput(),
      })

      const result = await externalSubmitHandler?.({
        api: params.getApi(),
        formData: params.getOutput(),
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
  if (result === false) {
    return { success: false }
  }
  if (isRecord(result) && result.success === false) {
    return { success: false }
  }
  if (isSuccessfulSubmitResult<TSubmitData>(result)) {
    return { data: result.data, success: true }
  }
  return { success: true }
}

function isSuccessfulSubmitResult<TSubmitData>(
  result: FormSubmitResult<TSubmitData> | undefined,
): result is { success: true; data: TSubmitData } {
  return isRecord(result) && result.success === true
}

function isCancelled(result: FormSubmitResult<never> | undefined) {
  return result === false || (isRecord(result) && result.success === false)
}

function getBeforeSubmit(schema: FormValue): FormSubmitHandler<FormObject, never> | undefined {
  if (!isRecord(schema)) {
    return undefined
  }
  const handler = Object.getOwnPropertyDescriptor(schema, 'onBeforeSubmit')?.value
  return isFunction(handler) ? handler : undefined
}

function getSchemaSubmit(schema: FormValue) {
  if (!isRecord(schema)) {
    return
  }
  const submit = Object.getOwnPropertyDescriptor(schema, 'submit')?.value
  return isFunction(submit) ? submit : undefined
}
