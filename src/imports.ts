import { addImports } from '@nuxt/kit'

type PublicImport = {
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
      { name: 'booleanCodec', from: 'query-state' },
      { name: 'createArrayCodec', from: 'query-state' },
      { name: 'createEnumCodec', from: 'query-state' },
      { name: 'dateISOCodec', from: 'query-state' },
      { name: 'dynamicQueryState', from: 'query-state' },
      { name: 'numberCodec', from: 'query-state' },
      { name: 'registerQueryStateClient', from: 'query-state' },
      { name: 'stringCodec', from: 'query-state' },
      { name: 'useQueryState', from: 'query-state' },
      { name: 'useQueryStateClient', from: 'query-state' },
      { name: 'useQueryStates', from: 'query-state' },
    ]),

    // Query prefetch
    ...withRuntime(runtimeDir, [
      { name: 'defineQueryPrefetch', from: 'query-prefetch' },
      { name: 'defineQueryPrefetchPlan', from: 'query-prefetch' },
      { name: 'executeQueryPrefetch', from: 'query-prefetch' },
      { name: 'executeQueryPrefetchPlan', from: 'query-prefetch' },
      { name: 'prefetchPage', from: 'query-prefetch' },
    ]),

    // I18n
    ...withRuntime(runtimeDir, [
      { name: 'defineUiToolsLocale', from: 'i18n' },
      { name: 'extendUiToolsLocale', from: 'i18n' },
      { name: 'provideUiToolsLocale', from: 'i18n' },
      { name: 'useUiToolsLocale', from: 'i18n' },
    ]),

    // Shared responsive helpers
    ...withRuntime(runtimeDir, [
      { name: 'getResponsiveValue', from: 'shared' },
      { name: 'parseResponsiveValue', from: 'shared' },
      { name: 'resolveResponsiveValueAtBreakpoint', from: 'shared' },
      { name: 'useResponsiveValue', from: 'shared' },
    ]),

    // Table
    ...withRuntime(runtimeDir, [
      { name: 'createTableColumnBuilder', from: 'table' },
      { name: 'createTableFilterBuilder', from: 'table' },
      { name: 'defineTableSchema', from: 'table' },
      { name: 'prefetchTable', from: 'table' },
      { name: 'useTable', from: 'table' },
    ]),

    // Form
    ...withRuntime(runtimeDir, [
      { name: 'defineFormField', from: 'form' },
      { name: 'defineFormFields', from: 'form' },
      { name: 'defineFormSchema', from: 'form' },
      { name: 'useForm', from: 'form' },
      { name: 'useFormApi', from: 'form' },
      { name: 'useFormSubmit', from: 'form' },
    ]),
  ])
}
