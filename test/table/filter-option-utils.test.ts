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
      facetCounts: [{ count: 3, value: 'todo' }],
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
      facetCounts: [{ count: 5, value: true }],
      missingCountFallback: 0,
      rows: [],
    })

    expect(entries.map((entry) => entry.count)).toStrictEqual([5, 0])
  })
})
