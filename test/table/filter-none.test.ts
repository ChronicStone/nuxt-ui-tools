import { describe, expect, it } from 'vitest'

import { TABLE_FILTER_NONE_VALUE } from '#ui-tools/table/constants/query-state'
import type { TableFilterResolveContext, TableResolvedFilterGroup } from '#ui-tools/table/types'
import { executeClientFacets, filterClientRows } from '#ui-tools/table/utils/client-query'
import { resolveTableGlobalFacetDescriptors } from '#ui-tools/table/utils/facets'
import { buildFilterPreview } from '#ui-tools/table/utils/filters/preview'
import { createResolvedFilterState } from '#ui-tools/table/utils/resolved-filters'

const NONE = TABLE_FILTER_NONE_VALUE

function tagsDefinition(extra: Record<string, unknown> = {}) {
  return {
    behavior: { defaultOperator: 'isAnyOf' as const },
    key: 'tagLinks.tagId',
    kind: 'option' as const,
    label: 'Tags',
    source: { none: { label: 'Sans tag' }, options: [{ label: 'VIP', value: 'vip' }] },
    ...extra,
  }
}

function resolve(
  value: unknown,
  operator: 'isAnyOf' | 'isNot' | 'is' = 'isAnyOf',
  definition = tagsDefinition(),
) {
  // SAFETY: each test passes a value the option rule accepts (a value or a list of values).
  return createResolvedFilterState({
    definitions: [definition],
    filters: { search: '', ui: [{ key: 'tagLinks.tagId', operator, value: value as never }] },
  }).children
}

describe('source.none in resolved filters', () => {
  it('sends isEmpty alone, OR-ed with picked values, and AND-ed with isNotEmpty for isNot', () => {
    expect([
      resolve([NONE]),
      resolve([NONE, 'vip']),
      resolve([NONE, 'vip'], 'isNot'),
    ]).toStrictEqual([
      [{ key: 'tagLinks.tagId', operator: 'isEmpty', type: 'condition', value: null }],
      [
        {
          children: [
            { key: 'tagLinks.tagId', operator: 'isAnyOf', type: 'condition', value: ['vip'] },
            { key: 'tagLinks.tagId', operator: 'isEmpty', type: 'condition', value: null },
          ],
          combinator: 'or',
          type: 'group',
        },
      ],
      [
        {
          children: [
            { key: 'tagLinks.tagId', operator: 'isNot', type: 'condition', value: ['vip'] },
            { key: 'tagLinks.tagId', operator: 'isNotEmpty', type: 'condition', value: null },
          ],
          combinator: 'and',
          type: 'group',
        },
      ],
    ])
  })

  it('resolves a single-selection none value and tests none.key for emptiness', () => {
    expect([
      resolve(NONE, 'is'),
      resolve(
        [NONE],
        'isAnyOf',
        tagsDefinition({ source: { none: { key: 'tagId', label: 'x' } } }),
      ),
    ]).toStrictEqual([
      [{ key: 'tagLinks.tagId', operator: 'isEmpty', type: 'condition', value: null }],
      [{ key: 'tagId', operator: 'isEmpty', type: 'condition', value: null }],
    ])
  })

  it('hands a custom resolve only the real values, never ~none', () => {
    const seen: unknown[] = []
    const definition = tagsDefinition({
      resolve({ rule }: TableFilterResolveContext) {
        seen.push(rule.value)
        return {
          key: 'realTag',
          operator: 'isAnyOf' as const,
          type: 'condition' as const,
          value: rule.value,
        }
      },
    })
    const tree = resolve([NONE, 'vip'], 'isAnyOf', definition)
    expect([seen, JSON.stringify(tree).includes(NONE)]).toStrictEqual([[['vip']], false])
  })

  it('leaves values alone when the filter has no source.none', () => {
    const definition = tagsDefinition({ source: { options: [] } })
    expect(resolve(['vip'], 'isAnyOf', definition)).toStrictEqual([
      { key: 'tagLinks.tagId', operator: 'isAnyOf', type: 'condition', value: ['vip'] },
    ])
  })
})

const rows = [
  { id: 1, manager: 'Ada', tags: ['vip'] },
  { id: 2, manager: null, tags: [] },
  { id: 3, manager: '', tags: ['other'] },
  { id: 4, manager: 'Ada', tags: [] },
]

function only(key: string, operator: string): TableResolvedFilterGroup<string> {
  // SAFETY: the operator strings come from this file and name real client operators.
  return {
    children: [{ key, operator, type: 'condition', value: null }],
    combinator: 'and',
    type: 'group',
  } as TableResolvedFilterGroup<string>
}

function ids(filters: TableResolvedFilterGroup<string>) {
  return filterClientRows({ filters, rows, search: { fields: [], value: '' } }).map((row) => row.id)
}

describe('client isEmpty / isNotEmpty', () => {
  it('treats null, empty strings and empty arrays as empty', () => {
    expect([
      ids(only('manager', 'isEmpty')),
      ids(only('manager', 'isNotEmpty')),
      ids(only('tags', 'isEmpty')),
      ids(only('tags', 'isNotEmpty')),
    ]).toStrictEqual([
      [2, 3],
      [1, 4],
      [2, 4],
      [1, 3],
    ])
  })

  it('counts empty rows as the facet missing bucket', () => {
    // SAFETY: the facet path reads only `filters` and `search` from the request.
    const result = executeClientFacets({
      facets: [{ key: 'manager' }, { key: 'tags' }],
      request: {
        filters: { children: [], combinator: 'and', type: 'group' },
        search: { fields: [], value: '' },
      } as never,
      rows,
    })
    expect(result.facets.map((facet) => [facet.key, facet.missing])).toStrictEqual([
      ['manager', 2],
      ['tags', 2],
    ])
  })
})

describe('none in the chip preview', () => {
  it('labels ~none from source.none without any loaded option', () => {
    // SAFETY: tagsDefinition() is an option filter definition with a literal kind.
    const preview = buildFilterPreview({
      definition: tagsDefinition() as never,
      optionEntries: [],
      rule: { key: 'tagLinks.tagId', operator: 'isAnyOf', value: [NONE] },
    })
    expect([preview.tags, preview.entries?.[0]?.icon]).toStrictEqual([
      ['Sans tag'],
      'i-lucide-circle-slash',
    ])
  })
})

describe('facet requests for source.none', () => {
  it('asks for the missing count only on filters with a none entry', () => {
    // SAFETY: both definitions are literal option filters with a facet source.
    const definitions = [
      tagsDefinition({ source: { facet: 'exclude-self', none: { label: 'Sans tag' } } }),
      { ...tagsDefinition({ source: { facet: 'exclude-self' } }), key: 'status' },
    ] as never[]
    expect(resolveTableGlobalFacetDescriptors(definitions)).toStrictEqual([
      { key: 'tagLinks.tagId', limit: undefined, missing: true, mode: 'exclude-self' },
      { key: 'status', limit: undefined, mode: 'exclude-self' },
    ])
  })
})
