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
          nodes: [{ id: 2, title: () => 42 }],
          title: () => 'Catalog',
        },
      ],
      { children: 'nodes', label: 'title', value: 'id' },
    )

    expect(options).toStrictEqual([
      {
        children: [
          {
            value: 2,
            label: '42',
            description: undefined,
            disabled: false,
          },
        ],
        description: undefined,
        disabled: false,
        label: 'Catalog',
        value: 1,
      },
    ])
  })

  it('keeps valid nested values, removes duplicates, and preserves primitive types', () => {
    const options = normalizeOptionItems([
      { children: [{ value: 1, label: 'Number' }], label: 'String', value: '1' },
    ])

    expect(normalizeOptionSelection(['1', 1, 1, 'missing'], options)).toStrictEqual(['1', 1])
    expect(formOptionKey('1')).not.toBe(formOptionKey(1))
  })

  it('deduplicates created options already returned by a refreshed source', () => {
    const source = normalizeOptionItems([{ label: 'From source', value: 'existing' }])
    const created = normalizeOptionItems([
      { label: 'Created copy', value: 'existing' },
      { label: 'Created option', value: 'new' },
    ])

    expect(mergeResolvedOptions(source, created).map((option) => option.label)).toStrictEqual([
      'From source',
      'Created option',
    ])
  })
})
