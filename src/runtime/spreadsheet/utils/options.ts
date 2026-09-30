import type { QueryFnDefinition } from '#ui-tools/shared/types/query'
import type { RemoteOptionsLoader } from '#ui-tools/shared/types/remote-options'
import { isFunction } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import type {
  SpreadsheetFieldOptions,
  SpreadsheetOptionItem,
  SpreadsheetOptionsSource,
  SpreadsheetResolvedOption,
} from '../types'
import {
  isSpreadsheetOptionEntry,
  isSpreadsheetOptionList,
  isSpreadsheetOptionsResolver,
} from './guards'
import { isSpreadsheetRecord } from './paths'
import { normalizeSpreadsheetText } from './text'

export function isSpreadsheetQueryDefinition<TData>(
  value: unknown,
): value is QueryFnDefinition<TData> {
  return isSpreadsheetRecord(value) && Array.isArray(value.queryKey) && isFunction(value.queryFn)
}

export function isSpreadsheetRemoteLoader(
  value: unknown,
): value is RemoteOptionsLoader<SpreadsheetOptionItem> {
  return isSpreadsheetRecord(value) && isFunction(value.load) && isFunction(value.resolveSelected)
}

/**
 * What a source gives once resolved against the context: a list, a query, or a remote loader.
 * Sources reading the row are resolved per row instead (see `SpreadsheetField['select']`).
 */
export function resolveSpreadsheetOptionsSource(
  source: SpreadsheetOptionsSource<unknown, SpreadsheetOptionItem>,
  ctx: unknown,
):
  | { kind: 'list'; items: readonly SpreadsheetOptionItem[] }
  | { kind: 'query'; query: QueryFnDefinition<readonly SpreadsheetOptionItem[]> }
  | { kind: 'remote'; loader: RemoteOptionsLoader<SpreadsheetOptionItem> } {
  if (isSpreadsheetOptionList(source)) return { items: source, kind: 'list' }
  if (isSpreadsheetRemoteLoader(source)) return { kind: 'remote', loader: source }
  if (isSpreadsheetOptionsResolver(source)) {
    const resolved = source({ ctx, row: {} })
    return isSpreadsheetOptionList(resolved)
      ? { items: resolved, kind: 'list' }
      : { kind: 'query', query: resolved }
  }
  if (isSpreadsheetQueryDefinition<readonly SpreadsheetOptionItem[]>(source))
    return { kind: 'query', query: source }
  return { items: [], kind: 'list' }
}

export function toSpreadsheetOption(item: SpreadsheetOptionItem): SpreadsheetResolvedOption {
  if (isSpreadsheetOptionEntry(item))
    return {
      aliases: item.aliases ?? [],
      label: resolveTextValue(item.label, String(item.value)),
      value: item.value,
    }
  return { aliases: [], label: String(item), value: item }
}

/** Options indexed by every exact key they match: label, value, and aliases, normalized. */
export function indexSpreadsheetOptions(options: readonly SpreadsheetResolvedOption[]) {
  const index = new Map<string, SpreadsheetResolvedOption>()
  for (const option of options) {
    for (const key of [option.label, String(option.value), ...option.aliases]) {
      const normalized = normalizeSpreadsheetText(key)
      if (normalized && !index.has(normalized)) index.set(normalized, option)
    }
  }
  return index
}

/** Options of a list, ready to match. */
export function createSpreadsheetFieldOptions(
  items: readonly SpreadsheetOptionItem[],
): SpreadsheetFieldOptions {
  const options = items.map(toSpreadsheetOption)
  return {
    error: null,
    index: indexSpreadsheetOptions(options),
    options,
    remote: false,
    status: 'ready',
  }
}

/** Short stable id of a text (FNV-1a), for scope ids. */
export function hashSpreadsheetText(text: string) {
  let hash = 0x81_1c_9d_c5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01_00_01_93)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Key of an answer: the normalized value, prefixed by the scope when the options depend on the
 * row, since the same value may map to different options in each scope.
 */
export function spreadsheetAnswerKey(key: string, scope: string | null | undefined) {
  return scope ? `${scope}:${key}` : key
}
