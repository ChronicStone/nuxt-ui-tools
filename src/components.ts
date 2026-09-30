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
      'ErrorState',
      'Table',
      'Grid',
      'Pagination',
      'InfiniteLoader',
    ].map((part) => ({
      filePath: `${runtimeDir}/table/components/data-list/data-list-${toKebabCase(part)}.vue`,
      global: options.global,
      name: `${prefix}DataList${part}`,
    })),

    // Spreadsheet
    {
      filePath: `${runtimeDir}/spreadsheet/components/spreadsheet-import.vue`,
      global: options.global,
      name: `${prefix}SpreadsheetImport`,
    },
    {
      filePath: `${runtimeDir}/spreadsheet/components/spreadsheet-import-root.vue`,
      global: options.global,
      name: `${prefix}SpreadsheetImportRoot`,
    },
    ...[
      'Dropzone',
      'FileCard',
      'SourceSettings',
      'ExpectedColumns',
      'TemplateButton',
      'ColumnMapping',
      'ValueMapping',
      'Table',
      'TableToolbar',
      'RowInspector',
      'Stats',
      'Stat',
      'ExportButton',
      'SubmitButton',
      'Summary',
      'Progress',
    ].map((part) => ({
      filePath: `${runtimeDir}/spreadsheet/components/parts/spreadsheet-import-${toKebabCase(part)}.vue`,
      global: options.global,
      name: `${prefix}SpreadsheetImport${part}`,
    })),
    ...['Stepper', 'Step', 'StepNav'].map((part) => ({
      filePath: `${runtimeDir}/spreadsheet/components/steps/spreadsheet-import-${toKebabCase(part)}.vue`,
      global: options.global,
      name: `${prefix}SpreadsheetImport${part}`,
    })),

    // Dashboard
    ...[
      'Grid',
      'Card',
      'Filter',
      'Filters',
      'ViewTabs',
      'Stat',
      'Stats',
      'Details',
      'Gauge',
      'Tabs',
      'Refresh',
      'Widget',
      'List',
      'Bars',
      'PairedBars',
      'Funnel',
      'StackBar',
      'BarChart',
      'LineChart',
      'ComboChart',
      'DonutChart',
      'Alerts',
      'Feed',
      'Table',
      'Legend',
      'Total',
      'RelativeTime',
      'Page',
    ].map((part) => ({
      filePath: `${runtimeDir}/dashboard/components/dashboard-${toKebabCase(part)}.vue`,
      global: options.global,
      name: `${prefix}Dashboard${part}`,
    })),

    // File preview
    {
      filePath: `${runtimeDir}/file-preview/components/provider/file-preview-provider.vue`,
      global: options.global,
      name: `${prefix}FilePreviewProvider`,
    },
    {
      filePath: `${runtimeDir}/file-preview/components/shell/file-preview-tools.vue`,
      global: options.global,
      name: `${prefix}FilePreviewTools`,
    },

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
    ...['', 'Header', 'Navigation', 'Sections', 'Actions'].map((part) => ({
      filePath: `${runtimeDir}/form/components/page/form-page${part ? `-${toKebabCase(part)}` : ''}.vue`,
      global: options.global,
      name: `${prefix}FormPage${part}`,
    })),
  ]
}

function toKebabCase(value: string) {
  return value.replaceAll(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()
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
