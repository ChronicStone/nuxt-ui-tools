import type { FormValue } from './'
export interface FormUploadRuntimeState {
  start: () => Promise<void>
  cancel: () => Promise<void>
  retry: () => Promise<void>
  remove: (value?: FormValue) => Promise<void>
}
