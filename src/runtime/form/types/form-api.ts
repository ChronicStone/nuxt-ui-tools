import type { ComputedRef } from 'vue'

import type { FormSubmitHandler } from './api'
import type { FormController } from './controller'
import type { ExtractFormOutput } from './output'
import type { FormObject } from './utils'

export type FormApiDisplayMode = 'modal' | 'drawer' | 'fullscreen'

export type FormApiDisplayModeInput = FormApiDisplayMode | string | (() => FormApiDisplayModeInput)

export interface FormApiCreateBaseOptions {
  /** Optional stable runtime id used by external controls such as `closeForm` or `submitForm`. */
  id?: string
  /** Initial internal state passed to the rendered form. */
  input?: FormObject
  /** Overlay display mode used by the provider. Supports responsive values such as `drawer md:modal`. */
  mode?: FormApiDisplayModeInput
}

export interface FormApiCreateOptions<
  TSchema,
  TSubmitData = unknown,
> extends FormApiCreateBaseOptions {
  /** Optional submit handler owned by the form overlay. Keeps submit buttons pending until it settles. */
  onSubmit?: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
}

type CompletedFormApiResult<TOutput, TSubmitData> = [TSubmitData] extends [undefined]
  ? { isCompleted: true; formData: TOutput; submitData?: undefined }
  : { isCompleted: true; formData: TOutput; submitData: TSubmitData }

export type FormApiCreateResult<TOutput, TSubmitData = undefined> =
  | { isCompleted: false; formData: TOutput; submitData?: undefined }
  | CompletedFormApiResult<TOutput, TSubmitData>

export interface FormApiRuntimeInstance {
  id: string
  schema: unknown
  input?: FormObject
  mode: FormApiDisplayModeInput
  onSubmit?: FormSubmitHandler<FormObject, unknown>
  complete: (formData: FormObject, submitData?: unknown) => void
  cancel: (formData: FormObject) => void
}

export interface FormApiRuntimeControls {
  close: () => void
  submit: () => Promise<boolean>
}

export interface FormApiControllerRegistry {
  getController: (id: string) => FormController<unknown, unknown> | null
  setController: (id: string, controller: FormController<unknown, unknown>) => void
  removeController: (id: string, controller: FormController<unknown, unknown>) => void
  setRuntimeControls: (id: string, controls: FormApiRuntimeControls) => void
  removeRuntimeControls: (id: string, controls: FormApiRuntimeControls) => void
}

/**
 * Global form API provided by `<NutFormProvider>`.
 *
 * The primary entrypoint is `createForm`, which renders a schema in a provider-owned overlay
 * and resolves when the user submits or cancels the form.
 *
 * @example
 * ```ts
 * const result = await formApi.createForm(accountForm, {
 *   mode: 'drawer',
 *   input: account,
 *   onSubmit: ({ formData }) => saveAccount(formData),
 * })
 * ```
 */
export interface FormApiController extends FormApiControllerRegistry {
  /** Active provider-owned form overlays. */
  formInstances: ComputedRef<readonly FormApiRuntimeInstance[]>
  /** Opens a schema in the provider overlay runtime. */
  createForm: {
    <const TSchema>(schema: TSchema): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>>>
    <const TSchema, TSubmitData>(
      schema: TSchema,
      options: FormApiCreateBaseOptions & {
        onSubmit: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
      },
    ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>, TSubmitData>>
    <const TSchema>(
      schema: TSchema,
      input: FormObject,
    ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>>>
    <const TSchema, TSubmitData = undefined>(
      schema: TSchema,
      options: FormApiCreateOptions<TSchema, TSubmitData>,
    ): Promise<FormApiCreateResult<ExtractFormOutput<TSchema>, TSubmitData>>
  }
  /** Returns an active form overlay by id or form schema key. */
  getForm: (idOrFormKey: string) => FormApiRuntimeInstance | null
  /** True when a form overlay with the id or schema form key is active. */
  isOpen: (idOrFormKey: string) => boolean
  /** Cancels an active form overlay and resolves its promise as incomplete. */
  closeForm: (idOrFormKey: string) => boolean
  /** Submits an active form overlay through its controller, when mounted. */
  submitForm: (idOrFormKey: string) => Promise<boolean>
  /** Cancels every active form overlay. */
  destroyAll: () => void
}
