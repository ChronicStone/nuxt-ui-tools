import { describe, expect, it } from 'vitest'

import { resolveFilterOptionEntries } from '../../src/runtime/table/utils/filters/options'

describe('filter option utils', () => {
  it('falls back missing remote option counts to zero when requested', () => {
    const entries = resolveFilterOptionEntries({
      definition: {
        key: 'status',
        kind: 'option',
        label: 'Status',
      },
      deriveCounts: false,
      facetCounts: [{ value: 'todo', count: 3 }],
      missingCountFallback: 0,
      options: [
        { label: 'Todo', value: 'todo' },
        { label: 'Done', value: 'done' },
      ],
      rows: [],
    })

    expect(entries.map((entry) => entry.count)).toStrictEqual([3, 0])
  })

  it('falls back missing remote boolean counts to zero when requested', () => {
    const entries = resolveFilterOptionEntries({
      definition: {
        key: 'active',
        kind: 'boolean',
        label: 'Active',
      },
      deriveCounts: false,
      facetCounts: [{ value: true, count: 5 }],
      missingCountFallback: 0,
      rows: [],
    })

    expect(entries.map((entry) => entry.count)).toStrictEqual([5, 0])
  })
})
