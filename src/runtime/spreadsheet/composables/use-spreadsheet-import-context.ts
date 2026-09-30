import { computed, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import type { SpreadsheetImporter, SpreadsheetSteps } from '../types'

interface SpreadsheetImportProvided {
  readonly importer: SpreadsheetImporter
  readonly steps: SpreadsheetSteps | null
}

const SPREADSHEET_IMPORT: InjectionKey<SpreadsheetImportProvided> = Symbol.for(
  'nuxt-ui-tools.spreadsheet-import',
)

/** Provides an importer, and optionally its steps, to the `SpreadsheetImport*` parts below. */
export function provideSpreadsheetImport(provided: SpreadsheetImportProvided) {
  provide(SPREADSHEET_IMPORT, provided)
}

/** The importer of a part: its own `importer` prop, or the one of the closest root. */
export function useSpreadsheetImporter(own?: () => SpreadsheetImporter | undefined) {
  const provided = inject(SPREADSHEET_IMPORT, null)
  return computed(() => {
    const importer = own?.() ?? provided?.importer
    if (!importer)
      throw new Error(
        '[spreadsheet] Pass `importer` to the part or place it in a `SpreadsheetImportRoot`.',
      )
    return importer
  })
}

/** The steps of a part: its own `steps` prop, the closest root's, or `null` outside a wizard. */
export function useSpreadsheetStepsContext(own?: () => SpreadsheetSteps | undefined) {
  const provided = inject(SPREADSHEET_IMPORT, null)
  return computed(() => own?.() ?? provided?.steps ?? null)
}
