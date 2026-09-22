import { addImports } from '@nuxt/kit'

interface PublicImport {
  name: string
  from: string
}

function withRuntime(runtimeDir: string, imports: PublicImport[]) {
  return imports.map((entry) => ({
    ...entry,
    from: `${runtimeDir}/${entry.from}`,
  }))
}

export function setupImports(runtimeDir: string) {
  addImports([
    // Query state
    ...withRuntime(runtimeDir, [
      { from: 'query-state', name: 'booleanCodec' },
      { from: 'query-state', name: 'createArrayCodec' },
      { from: 'query-state', name: 'createEnumCodec' },
      { from: 'query-state', name: 'dateISOCodec' },
      { from: 'query-state', name: 'dynamicQueryState' },
      { from: 'query-state', name: 'numberCodec' },
      { from: 'query-state', name: 'registerQueryStateClient' },
      { from: 'query-state', name: 'stringCodec' },
      { from: 'query-state', name: 'useQueryState' },
      { from: 'query-state', name: 'useQueryStateClient' },
      { from: 'query-state', name: 'useQueryStates' },
    ]),

    // Query prefetch
    ...withRuntime(runtimeDir, [
      { from: 'query-prefetch', name: 'defineQueryPrefetch' },
      { from: 'query-prefetch', name: 'defineQueryPrefetchPlan' },
      { from: 'query-prefetch', name: 'executeQueryPrefetch' },
      { from: 'query-prefetch', name: 'executeQueryPrefetchPlan' },
      { from: 'query-prefetch', name: 'prefetchPage' },
    ]),

    // I18n
    ...withRuntime(runtimeDir, [
      { from: 'i18n', name: 'defineUiToolsLocale' },
      { from: 'i18n', name: 'extendUiToolsLocale' },
      { from: 'i18n', name: 'provideUiToolsLocale' },
      { from: 'i18n', name: 'useUiToolsLocale' },
    ]),

    // Shared responsive helpers
    ...withRuntime(runtimeDir, [
      { from: 'shared', name: 'getResponsiveValue' },
      { from: 'shared', name: 'parseResponsiveValue' },
      { from: 'shared', name: 'resolveResponsiveValueAtBreakpoint' },
      { from: 'shared', name: 'useResponsiveValue' },
    ]),

    // Table
    ...withRuntime(runtimeDir, [
      { from: 'table', name: 'createTableColumnBuilder' },
      { from: 'table', name: 'createTableFilterBuilder' },
      { from: 'table', name: 'defineTableSchema' },
      { from: 'table', name: 'prefetchTable' },
      { from: 'table', name: 'remoteTableOptions' },
      { from: 'table', name: 'tableSource' },
      { from: 'table', name: 'useTable' },
    ]),

    // Dashboard
    ...withRuntime(runtimeDir, [
      { from: 'dashboard', name: 'defineDashboardFilter' },
      { from: 'dashboard', name: 'defineDashboardFilters' },
      { from: 'dashboard', name: 'defineDashboardSchema' },
      { from: 'dashboard', name: 'defineDashboardView' },
      { from: 'dashboard', name: 'injectDashboard' },
      { from: 'dashboard', name: 'useDashboard' },
      { from: 'dashboard', name: 'useDashboardFormat' },
      { from: 'dashboard', name: 'useDashboardView' },
      { from: 'dashboard', name: 'resolveDashboardComparisonRange' },
    ]),

    // Form
    ...withRuntime(runtimeDir, [
      { from: 'form', name: 'defineFormField' },
      { from: 'form', name: 'defineFormFields' },
      { from: 'form', name: 'defineFormSchema' },
      { from: 'form', name: 'useForm' },
      { from: 'form', name: 'useFormApi' },
    ]),
  ])
}
