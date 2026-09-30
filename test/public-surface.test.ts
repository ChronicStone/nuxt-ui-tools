import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function readRepositoryFile(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf-8')
}

describe('public package surface', () => {
  it('exports every release-ready runtime domain', () => {
    const packageManifest = readRepositoryFile('package.json')

    for (const domain of [
      'file-preview',
      'form',
      'i18n',
      'query-prefetch',
      'query-state',
      'shared',
      'spreadsheet',
      'table',
    ]) {
      expect(packageManifest).toContain(`"./${domain}"`)
    }
  })

  it('registers the spreadsheet import entry points with Nuxt', () => {
    const moduleSource = readRepositoryFile('src/module.ts')
    const importsSource = readRepositoryFile('src/imports.ts')
    const componentsSource = readRepositoryFile('src/components.ts')

    expect(moduleSource).not.toContain("alias['#ui-tools']")
    expect(moduleSource).toContain("'spreadsheet'")
    expect(importsSource).toContain("{ from: 'spreadsheet', name: 'defineSpreadsheetSchema' }")
    expect(importsSource).toContain("{ from: 'spreadsheet', name: 'useSpreadsheetImport' }")
    expect(componentsSource).toContain('SpreadsheetImport')
  })

  it('keeps useForm as the only public form controller', () => {
    const importsSource = readRepositoryFile('src/imports.ts')
    const formEntry = readRepositoryFile('src/runtime/form/index.ts')

    expect(importsSource).toContain("{ from: 'form', name: 'useForm' }")
    expect(importsSource).not.toContain('useFormSubmit')
    expect(formEntry).not.toContain('useFormSubmit')
  })

  it('auto-imports the table source inference helper', () => {
    const importsSource = readRepositoryFile('src/imports.ts')
    const tableUtilsEntry = readRepositoryFile('src/runtime/table/utils/index.ts')

    expect(importsSource).toContain("{ from: 'table', name: 'tableSource' }")
    expect(tableUtilsEntry).toContain('tableSource')
  })
})
