import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import type { QueryFnDefinition } from '#ui-tools/shared/types/query'
import { REMOTE_OPTIONS_FIRST_PAGE } from '#ui-tools/shared/utils/remote-options'

import type {
  SpreadsheetField,
  SpreadsheetFieldOptions,
  SpreadsheetOptionItem,
  SpreadsheetRecord,
  SpreadsheetResolvedOption,
} from '../types'
import {
  createSpreadsheetFieldOptions,
  hashSpreadsheetText,
  indexSpreadsheetOptions,
  normalizeSpreadsheetText,
  resolveSpreadsheetOptionsSource,
  splitSpreadsheetItems,
  toSpreadsheetOption,
  toSpreadsheetText,
} from '../utils'
import type { SpreadsheetRowOptions } from '../utils'
import type { useSpreadsheetColumns } from './use-spreadsheet-columns'
import type { useSpreadsheetContext } from './use-spreadsheet-context'
import type { useSpreadsheetEdits } from './use-spreadsheet-edits'
import type { useSpreadsheetFields } from './use-spreadsheet-fields'
import type { useSpreadsheetLayout } from './use-spreadsheet-layout'
import { useSpreadsheetQueries } from './use-spreadsheet-queries'

/** Distinct values searched one by one when a remote loader has no `resolveLabels`. */
const MAX_SEARCHED_VALUES = 100

export interface UseSpreadsheetOptionsParams {
  fields: ReturnType<typeof useSpreadsheetFields>
  columns: ReturnType<typeof useSpreadsheetColumns>
  layout: ReturnType<typeof useSpreadsheetLayout>
  edits: ReturnType<typeof useSpreadsheetEdits>
  context: ReturnType<typeof useSpreadsheetContext>
}

function isOptionList(value: unknown): value is readonly SpreadsheetOptionItem[] {
  return Array.isArray(value)
}

/**
 * Options of every select field: lists as they are, queries once loaded, and remote loaders
 * resolved for the values the file holds, exactly.
 */
export function useSpreadsheetOptions(params: UseSpreadsheetOptionsParams) {
  const queryClient = useQueryClient()
  const sources = computed(() =>
    params.fields.fields.value.flatMap((field) =>
      field.select && !field.select.rowOptions
        ? [
            {
              field,
              source: resolveSpreadsheetOptionsSource(
                field.select.source,
                params.context.ctx.value,
              ),
            },
          ]
        : [],
    ),
  )

  /** Distinct texts of a select field, edits included, for remote lookups. */
  function distinctTexts(field: SpreadsheetField) {
    const from = field.select?.from ?? null
    const column = params.columns.matches.value.get(from ?? field.path)
    const values = new Set<string>()
    for (const [index, row] of params.layout.dataRows.value.entries()) {
      const edits = params.edits.edits.value.get(index)
      const text =
        edits?.[field.path] ??
        (from ? edits?.[from] : undefined) ??
        (column === undefined ? '' : toSpreadsheetText(row[column]))
      for (const item of field.separator ? splitSpreadsheetItems(text, field.separator) : [text])
        if (item) values.add(item)
    }
    return [...values]
  }

  const plan = computed(() =>
    sources.value.map((entry) => {
      const { source, field } = entry
      if (source.kind === 'list')
        return { field, kind: 'list' as const, queries: [], items: source.items }
      if (source.kind === 'query')
        return { field, kind: 'query' as const, queries: [source.query], items: [] }
      const texts = distinctTexts(field)
      const resolveLabels = source.loader.resolveLabels
      const queries: QueryFnDefinition<unknown>[] = !texts.length
        ? []
        : resolveLabels
          ? [resolveLabels({ labels: texts })]
          : texts.slice(0, MAX_SEARCHED_VALUES).map((text) =>
              source.loader.load({
                page: { ...REMOTE_OPTIONS_FIRST_PAGE, size: source.loader.pagination.size },
                search: text,
              }),
            )
      return { field, kind: 'remote' as const, queries, items: [] }
    }),
  )

  const results = useSpreadsheetQueries(() => plan.value.flatMap((entry) => entry.queries))

  const options = computed(() => {
    const map = new Map<string, SpreadsheetFieldOptions>()
    let cursor = 0
    for (const entry of plan.value) {
      if (entry.kind === 'list') {
        const list = entry.items.map(toSpreadsheetOption)
        map.set(entry.field.path, {
          error: null,
          index: indexSpreadsheetOptions(list),
          options: list,
          remote: false,
          status: 'ready',
        })
        continue
      }
      const slice = results.value.slice(cursor, cursor + entry.queries.length)
      cursor += entry.queries.length
      const pending = slice.some((result) => result.pending)
      const error = slice.find((result) => result.error)?.error ?? null
      const items: SpreadsheetOptionItem[] = []
      for (const result of slice) {
        const data = result.data
        if (isOptionList(data)) items.push(...data)
        else if (
          data &&
          typeof data === 'object' &&
          'options' in data &&
          isOptionList(data.options)
        )
          items.push(...data.options)
      }
      const list = dedupe(items.map(toSpreadsheetOption))
      map.set(entry.field.path, {
        error,
        index: indexSpreadsheetOptions(list),
        options: list,
        remote: entry.kind === 'remote',
        status: error ? 'error' : pending ? 'loading' : 'ready',
      })
    }
    return map
  })

  const loading = computed(() =>
    [...options.value.values()].some((entry) => entry.status === 'loading'),
  )

  /**
   * Options resolved per row, by field and by set of options: rows with the same options share
   * them, and their scope. Cleared when the fields change.
   */
  const rowCache = computed(() => {
    void params.fields.fields.value
    return {
      byList: new WeakMap<object, SpreadsheetRowOptions>(),
      bySignature: new Map<string, SpreadsheetRowOptions>(),
    }
  })

  /** Options of a select field for a row: the field's, or those its options return for the row. */
  function optionsOf(field: SpreadsheetField, row: SpreadsheetRecord): SpreadsheetRowOptions {
    const rowOptions = field.select?.rowOptions
    if (!rowOptions) return { options: options.value.get(field.path), scope: null }
    const cache = rowCache.value
    const items = rowOptions.resolve(row)
    const known = cache.byList.get(items)
    if (known) return known
    const fieldOptions = createSpreadsheetFieldOptions(items)
    const signature = `${field.path}\u0000${JSON.stringify(
      fieldOptions.options.map((option) => [String(option.value), option.label, option.aliases]),
    )}`
    const shared = cache.bySignature.get(signature) ?? {
      options: fieldOptions,
      scope: hashSpreadsheetText(signature),
    }
    cache.bySignature.set(signature, shared)
    cache.byList.set(items, shared)
    return shared
  }

  /** Searches a remote field's options, or filters a list field's options by label. */
  async function search(path: string, text: string): Promise<readonly SpreadsheetResolvedOption[]> {
    const entry = sources.value.find((candidate) => candidate.field.path === path)
    if (!entry) return []
    if (entry.source.kind !== 'remote') {
      const query = normalizeSpreadsheetText(text)
      return (options.value.get(path)?.options ?? []).filter((option) =>
        normalizeSpreadsheetText(option.label).includes(query),
      )
    }
    const loader = entry.source.loader
    const page = await queryClient.fetchQuery(
      loader.load({
        page: { ...REMOTE_OPTIONS_FIRST_PAGE, size: loader.pagination.size },
        search: text,
      }),
    )
    return page.options.map(toSpreadsheetOption)
  }

  return { loading, options, optionsOf, search }
}

function dedupe(options: readonly SpreadsheetResolvedOption[]) {
  const seen = new Set<string>()
  return options.filter((option) => {
    const key = String(option.value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
