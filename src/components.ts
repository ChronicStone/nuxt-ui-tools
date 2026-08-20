import { addComponent } from '@nuxt/kit'

type PublicComponent = {
  name: string
  filePath: string
  global: boolean | undefined
}

function getPublicComponents(
  runtimeDir: string,
  options: {
    prefix?: string
    global?: boolean
  },
): PublicComponent[] {
  const prefix = options.prefix ?? 'Ui'

  return [
    // I18n
    {
      name: `${prefix}ToolsProvider`,
      filePath: `${runtimeDir}/i18n/provider.vue`,
      global: options.global,
    },

    // Table
    {
      name: `${prefix}DataList`,
      filePath: `${runtimeDir}/table/components/DataList.vue`,
      global: options.global,
    },
    ...[
      'Root',
      'ActionsDropdown',
      'ActionsToolbar',
      'SelectionActions',
      'Search',
      'FilterTags',
      'AddFilter',
      'FilterPanel',
      'ClearFilters',
      'ResultCount',
      'Refresh',
      'ColumnPanel',
      'SortMenu',
      'LayoutSwitch',
      'Content',
      'Table',
      'Grid',
      'Pagination',
      'InfiniteLoader',
    ].map((part) => ({
      name: `${prefix}DataList${part}`,
      filePath: `${runtimeDir}/table/components/data-list/DataList${part}.vue`,
      global: options.global,
    })),

    // Form
    {
      name: `${prefix}Form`,
      filePath: `${runtimeDir}/form/components/root/Form.vue`,
      global: options.global,
    },
    {
      name: `${prefix}FormProvider`,
      filePath: `${runtimeDir}/form/components/provider/FormProvider.vue`,
      global: options.global,
    },
  ]
}

export function setupComponents(
  runtimeDir: string,
  options: {
    prefix?: string
    global?: boolean
  },
) {
  for (const component of getPublicComponents(runtimeDir, options)) addComponent(component)
}
