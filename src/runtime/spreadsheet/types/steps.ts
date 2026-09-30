import type { LazyTextValue } from '#ui-tools/shared/types/utils'

import type {
  SpreadsheetFieldStatus,
  SpreadsheetFileModel,
  SpreadsheetReadiness,
  SpreadsheetSubmitModel,
} from './importer'

/** What step checks read: the importer of any schema fits it. */
export interface SpreadsheetStepContext {
  readonly file: Pick<SpreadsheetFileModel, 'loaded' | 'reading'>
  readonly columns: {
    readonly missing: readonly unknown[]
    readonly fields: readonly { readonly status: SpreadsheetFieldStatus }[]
  }
  readonly values: { readonly open: readonly unknown[]; readonly questions: readonly unknown[] }
  readonly rows: { readonly all: readonly unknown[]; readonly invalid: readonly unknown[] }
  readonly readiness: SpreadsheetReadiness
  readonly submit: Pick<SpreadsheetSubmitModel, 'status'>
}

/** Keys of the built-in steps. */
export type SpreadsheetBuiltInStep = 'file' | 'columns' | 'values' | 'review' | 'submit'

/**
 * A step of a wizard. Built-in steps come from `spreadsheetSteps.*`; a step of your own is the same
 * object with its own `key`, label, and checks.
 */
export interface SpreadsheetStep {
  key: string
  /** The built-in step this one is, for its default content. */
  builtIn?: SpreadsheetBuiltInStep
  label?: LazyTextValue
  hint?: LazyTextValue
  /**
   * `always` (default) shows the step; `when-needed` skips it when it has nothing to do, shown as
   * done in the stepper.
   */
  show?: 'always' | 'when-needed'
  /** Whether the user can move on. Defaults to `true`. */
  ready?: (importer: SpreadsheetStepContext) => boolean
  /** With `show: 'when-needed'`: whether the step has something to do. Defaults to `true`. */
  needed?: (importer: SpreadsheetStepContext) => boolean
  /** What still blocks the step, shown next to the navigation. */
  blockers?: (importer: SpreadsheetStepContext) => number
}

export type SpreadsheetStepState = 'done' | 'current' | 'upcoming' | 'skipped'

/** A step with its state in the wizard. */
export interface SpreadsheetStepStatus {
  key: string
  builtIn: SpreadsheetBuiltInStep | null
  label: LazyTextValue | undefined
  hint: LazyTextValue | undefined
  state: SpreadsheetStepState
  /** 1-based position among the steps. */
  position: number
  ready: boolean
  skipped: boolean
  blockers: number
}

export interface SpreadsheetSteps {
  readonly list: readonly SpreadsheetStepStatus[]
  /** Key of the current step. */
  readonly current: string
  readonly step: SpreadsheetStepStatus | null
  readonly canNext: boolean
  readonly canBack: boolean
  readonly isLast: boolean
  /** Moves to the next step that is not skipped, when the current one is ready. */
  next(): void
  back(): void
  /** Moves to a step before the current one, or to the current one. */
  goTo(key: string): void
  /** Back to the first step. */
  reset(): void
}
