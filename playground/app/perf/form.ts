import type { FormRendererController, FormValue } from '#ui-tools/form'

export interface PerfScenarioOptions {
  /** Rows of a table scenario, or copies of the catalog form. */
  rows: number
  /** Inert mode of every table: `'auto'` (default), `true` (always inert) or `false` (live). */
  inert: boolean | 'auto'
  mount: number
}

/** A mounted scenario: the form to render and the controls the stress page and harness use. */
export interface PerfScenarioForm {
  form: FormRendererController
  validate: () => Promise<boolean>
  set: (path: string, value: FormValue) => void
}

export interface PerfScenario {
  label: string
  description: string
  sizes: readonly number[]
  unit: string
  create: (options: PerfScenarioOptions) => PerfScenarioForm
}

export function exposePerfForm(
  form: FormRendererController & {
    validate: () => Promise<boolean>
    state: { set: (path: string, value: FormValue) => void }
  },
): PerfScenarioForm {
  return { form, set: form.state.set, validate: () => form.validate() }
}
