import { addComponent } from '@nuxt/kit'

type PublicComponent = {
  name: string
  filePath: string
  global: boolean | undefined
}

function getPublicComponents(runtimeDir: string, options: {
  prefix?: string
  global?: boolean
}): PublicComponent[] {
  const prefix = options.prefix ?? 'Ui'

  return [
    // Table
    {
      name: `${prefix}DataList`,
      filePath: `${runtimeDir}/table/components/DataList.vue`,
      global: options.global,
    },

    // Spreadsheet
    {
      name: `${prefix}SpreadsheetImport`,
      filePath: `${runtimeDir}/spreadsheet/components/SpreadsheetImport.vue`,
      global: options.global,
    },
  ]
}

export function setupComponents(runtimeDir: string, options: {
  prefix?: string
  global?: boolean
}) {
  for (const component of getPublicComponents(runtimeDir, options))
    addComponent(component)
}
