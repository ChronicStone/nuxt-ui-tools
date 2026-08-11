import { describe, expect, it } from 'vitest'

import { resolveFilterOptionEntries } from '../../src/runtime/table/utils/filters/options'

describe('filter option utils', () => {
  it('falls back missing remote option counts to zero when requested', () => {
    const entries = resolveFilterOptionEntries({
      definition: {
        kind: 'option',
        key: 'status',
        label: 'Status',
      },
      rows: [],
      options: [
        { label: 'Todo', value: 'todo' },
        { label: 'Done', value: 'done' },
      ],
      facetCounts: [{ value: 'todo', count: 3 }],
      deriveCounts: false,
      missingCountFallback: 0,
    })

    expect(entries.map((entry) => entry.count)).toEqual([3, 0])
  })

  it('falls back missing remote boolean counts to zero when requested', () => {
    const entries = resolveFilterOptionEntries({
      definition: {
        kind: 'boolean',
        key: 'active',
        label: 'Active',
      },
      rows: [],
      facetCounts: [{ value: true, count: 5 }],
      deriveCounts: false,
      missingCountFallback: 0,
    })

    expect(entries.map((entry) => entry.count)).toEqual([5, 0])
  })
})
