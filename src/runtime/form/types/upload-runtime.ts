export interface FormUploadRuntimeState {
  start: () => Promise<void>
  cancel: () => Promise<void>
  retry: () => Promise<void>
  remove: (value?: unknown) => Promise<void>
}
