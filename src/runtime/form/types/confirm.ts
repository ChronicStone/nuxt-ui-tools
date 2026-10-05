/** A question the form asks before discarding work. */
export interface FormConfirmRequest {
  /** `unsaved-changes` before leaving a dirty form; `remove-item` before removing an array item. */
  kind: 'unsaved-changes' | 'remove-item'
  /** Localized message: the schema's text or the engine default. */
  message: string
}

/** App-provided confirmation, such as a modal. Resolves `true` to go ahead. */
export type FormConfirmHandler = (request: FormConfirmRequest) => boolean | Promise<boolean>
