import { describe, expect, it } from 'vitest'

import { filterClientRows } from '#ui-tools/table/utils/client-query'
import {
  parsePersistedFilterRule,
  persistedFilterStorageKey,
  serializePersistedFilterRule,
} from '#ui-tools/table/utils/filter-persistence'
import {
  createResolvedFilterState,
  withoutQueryFilterRules,
} from '#ui-tools/table/utils/resolved-filters'

const definitions = [
  {
    behavior: { applyTo: 'query' as const, defaultOperator: 'isAnyOf' as const, persist: true },
    key: 'certification',
    kind: 'option' as const,
    label: 'Certification',
    source: { options: [{ label: 'RS6905', value: 'RS6905' }] },
  },
  {
    behavior: { defaultOperator: 'isAnyOf' as const },
    key: 'status',
    kind: 'option' as const,
    label: 'Status',
    source: { options: [{ label: 'Live', value: 'live' }] },
  },
]
const filters = {
  search: '',
  ui: [
    { key: 'certification', operator: 'isAnyOf' as const, value: ['RS6905'] },
    { key: 'status', operator: 'isAnyOf' as const, value: ['live'] },
  ],
}

describe('query-scoped filters', () => {
  it('keeps query filters in the request but never matches rows against them', () => {
    const request = createResolvedFilterState({ definitions, filters })
    const rowFilters = createResolvedFilterState({
      definitions,
      filters: withoutQueryFilterRules({ definitions, filters }),
    })
    const rows = [
      { id: 1, status: 'live' },
      { id: 2, status: 'paused' },
    ]

    expect(request.children.map((node) => node.type === 'condition' && node.key)).toEqual([
      'certification',
      'status',
    ])
    expect(
      filterClientRows({ filters: rowFilters, rows, search: { fields: [], value: '' } }),
    ).toEqual([{ id: 1, status: 'live' }])
  })

  it('returns the same state when no filter targets the query', () => {
    const plain = { search: '', ui: [filters.ui[1]!] }

    expect(withoutQueryFilterRules({ definitions: [definitions[1]!], filters: plain })).toBe(plain)
  })
})

describe('persisted filters', () => {
  const [certification] = definitions

  it('scopes the storage key by table and filter', () => {
    expect(persistedFilterStorageKey({ tableKey: 'centers', filterKey: 'certification' })).toBe(
      'nuxt-ui-tools:table-filter:centers:certification',
    )
  })

  it('round-trips a rule through the filter codec', () => {
    const raw = serializePersistedFilterRule({ definition: certification!, rule: filters.ui[0]! })

    expect(parsePersistedFilterRule({ definition: certification!, raw })).toEqual({
      key: 'certification',
      operator: 'isAnyOf',
      value: ['RS6905'],
    })
  })

  it('drops stored values the filter no longer accepts', () => {
    for (const raw of [
      null,
      'not json',
      JSON.stringify({ operator: 'between', value: 'RS6905' }),
      JSON.stringify({ operator: 'isAnyOf', value: 42 }),
    ]) {
      expect(parsePersistedFilterRule({ definition: certification!, raw })).toBeNull()
    }
  })
})
