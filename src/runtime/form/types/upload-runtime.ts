import type { FormValue } from './'

export interface FormUploadRuntimeState {
  start: () => Promise<void>
  cancel: () => Promise<void>
  retry: () => Promise<void>
  remove: (value?: FormValue) => Promise<void>
  /** Resolves once every upload running for the field has finished or failed. */
  settle: () => Promise<void>
  /** True while the field holds selected files that are not stored yet. */
  pending: () => boolean
}
