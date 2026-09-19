import { addComponent } from '@nuxt/kit'

interface PublicComponent {
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
      filePath: `${runtimeDir}/i18n/provider.vue`,
      global: options.global,
      name: `${prefix}ToolsProvider`,
    },

    // Table
    {
      filePath: `${runtimeDir}/table/components/data-list.vue`,
      global: options.global,
      name: `${prefix}DataList`,
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
      filePath: `${runtimeDir}/table/components/data-list/data-list-${toKebabCase(part)}.vue`,
      global: options.global,
      name: `${prefix}DataList${part}`,
    })),

    // Form
    {
      filePath: `${runtimeDir}/form/components/root/form.vue`,
      global: options.global,
      name: `${prefix}Form`,
    },
    {
      filePath: `${runtimeDir}/form/components/provider/form-provider.vue`,
      global: options.global,
      name: `${prefix}FormProvider`,
    },
  ]
}

function toKebabCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()
}

export function setupComponents(
  runtimeDir: string,
  options: {
    prefix?: string
    global?: boolean
  },
) {
  for (const component of getPublicComponents(runtimeDir, options)) {
    addComponent(component)
  }
}
