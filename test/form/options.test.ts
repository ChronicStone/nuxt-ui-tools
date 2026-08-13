import { describe, expect, it } from 'vitest'

import {
  formOptionKey,
  mergeResolvedOptions,
  normalizeOptionItems,
  normalizeOptionSelection,
} from '../../src/runtime/form/utils/options'

describe('form option normalization', () => {
  it('resolves lazy text and authored hierarchy keys recursively', () => {
    const options = normalizeOptionItems(
      [
        {
          id: 1,
          title: () => 'Catalog',
          nodes: [{ id: 2, title: () => 42 }],
        },
      ],
      { value: 'id', label: 'title', children: 'nodes' },
    )

    expect(options).toEqual([
      {
        value: 1,
        label: 'Catalog',
        description: undefined,
        disabled: false,
        children: [
          {
            value: 2,
            label: '42',
            description: undefined,
            disabled: false,
          },
        ],
      },
    ])
  })

  it('keeps valid nested values, removes duplicates, and preserves primitive types', () => {
    const options = normalizeOptionItems([
      { value: '1', label: 'String', children: [{ value: 1, label: 'Number' }] },
    ])

    expect(normalizeOptionSelection(['1', 1, 1, 'missing'], options)).toEqual(['1', 1])
    expect(formOptionKey('1')).not.toBe(formOptionKey(1))
  })

  it('deduplicates created options already returned by a refreshed source', () => {
    const source = normalizeOptionItems([{ value: 'existing', label: 'From source' }])
    const created = normalizeOptionItems([
      { value: 'existing', label: 'Created copy' },
      { value: 'new', label: 'Created option' },
    ])

    expect(mergeResolvedOptions(source, created).map((option) => option.label)).toEqual([
      'From source',
      'Created option',
    ])
  })
})
