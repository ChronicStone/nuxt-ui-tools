import type { ComputedRef, Ref } from 'vue'

import type { FormSubmitHandlerResult } from './api'
import type { FormRendererController } from './controller'
import type { FormDrawerConfig, FormFullscreenConfig, FormModalConfig } from './schema'
import type { FormOverlayUi } from './ui'
import type { FormObject } from './utils'

export interface FormOverlayLayoutProps {
  open: boolean
  title?: string
  description?: string
  dismissible: boolean
  ui?: FormOverlayUi
}

export interface FormModalLayoutProps extends FormOverlayLayoutProps {
  config?: FormModalConfig
}

export interface FormDrawerLayoutProps extends FormOverlayLayoutProps {
  config?: FormDrawerConfig
}

export interface FormFullscreenLayoutProps extends FormOverlayLayoutProps {
  config?: FormFullscreenConfig
}

export interface FormOverlayLayoutEmits {
  'update:open': [value: boolean]
  'after-close': []
}

export type FormOverlayResolution =
  | { type: 'complete'; formData: FormObject; submitData?: unknown }
  | { type: 'cancel'; formData: FormObject }

export interface FormOverlayController {
  form: FormRendererController
  open: Ref<boolean>
  title: ComputedRef<string | undefined>
  description: ComputedRef<string | undefined>
  dismissible: ComputedRef<boolean>
  handleOpenUpdate: (value: boolean) => void
  handleSubmitted: (formData: FormObject, result: FormSubmitHandlerResult<unknown>) => void
  resolveAfterClose: () => void
}
