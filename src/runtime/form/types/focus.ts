/**
 * Internal focus request emitted by the runtime and consumed by mounted field renderers.
 */
export interface FormFocusRequest {
  /** Normalized dotted field path to focus. */
  path: string
  /** Monotonic value so repeated focus calls to the same path still notify renderers. */
  sequence: number
}
