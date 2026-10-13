import { queryOptions } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { defineFormField } from '#ui-tools/form'

import {
  formOptionKey,
  mergeResolvedOptions,
  normalizeOptionItems,
  normalizeOptionSelection,
  readOptionSource,
  resolveOptionGroupKey,
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
            description: undefined,
            disabled: false,
            group: undefined,
            icon: undefined,
            label: '42',
            value: 2,
          },
        ],
        description: undefined,
        disabled: false,
        group: undefined,
        icon: undefined,
        label: 'Catalog',
        value: 1,
      },
    ])
  })

  it('resolves the group heading of an option through the mapped property, lazily', () => {
    const options = normalizeOptionItems(
      [
        { group: 'Partenaire', label: 'Revendeur', value: 'reseller' },
        { group: () => 'Centre de test', label: 'Centre', value: 'center' },
        { group: 3, label: 'Numérique', value: 'numeric' },
        { group: { not: 'text' }, label: 'Autre', value: 'other' },
        'plain',
      ],
      { group: 'group' },
    )

    expect(options.map((option) => option.group)).toStrictEqual([
      'Partenaire',
      'Centre de test',
      '3',
      undefined,
      undefined,
    ])
  })

  it('does not read a group property the keys do not map', () => {
    const records = [
      { group: 'Partenaire', label: 'Revendeur', value: 'reseller' },
      { group: () => 'Centre de test', label: 'Centre', value: 'center' },
    ]

    expect(normalizeOptionItems(records).map((option) => option.group)).toStrictEqual([
      undefined,
      undefined,
    ])
    expect(normalizeOptionItems(records, { label: 'label' })[0]?.group).toBeUndefined()
  })

  it('reads the group heading from any mapped property and ignores group itself', () => {
    const options = normalizeOptionItems(
      [
        { category: 'Partenaire', group: 'Ignorée', label: 'Revendeur', value: 'reseller' },
        { group: 'Ignorée', label: 'Sans catégorie', value: 'none' },
      ],
      { group: 'category' },
    )

    expect(options.map((option) => option.group)).toStrictEqual(['Partenaire', undefined])
  })

  it('applies the mapped group property to nested options', () => {
    const [parent] = normalizeOptionItems(
      [
        {
          children: [{ group: 'Interne', label: 'Support', value: 'support' }],
          group: 'Externe',
          label: 'Équipes',
          value: 'teams',
        },
      ],
      { group: 'group' },
    )

    expect([parent?.group, parent?.children?.[0]?.group]).toStrictEqual(['Externe', 'Interne'])
  })

  it('keeps valid nested values, removes duplicates, and preserves primitive types', () => {
    const options = normalizeOptionItems([
      { children: [{ label: 'Number', value: 1 }], label: 'String', value: '1' },
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

describe('option group key', () => {
  const records = [{ group: 'Partenaire', label: 'Revendeur', value: 'reseller' }]
  const inline = defineFormField({ key: 'kind', options: records, type: 'radio-card' })
  const inlineSource = defineFormField({
    key: 'kinds',
    options: { source: records },
    type: 'checkbox-card',
  })

  it('defaults to the group property for options written inline in the schema', () => {
    expect(resolveOptionGroupKey(inline)).toBe('group')
    expect(resolveOptionGroupKey(inlineSource)).toBe('group')
  })

  it('gives the records a function, a promise or a query returns no default', () => {
    const fromFunction = defineFormField({
      key: 'kind',
      options: () => records,
      type: 'radio-card',
    })
    const fromPromise = defineFormField({
      key: 'kind',
      options: async () => records,
      type: 'radio-card',
    })
    const fromQuery = defineFormField({
      key: 'kind',
      options: () => queryOptions({ queryFn: async () => records, queryKey: ['records'] }),
      type: 'radio-card',
    })
    const fromSource = defineFormField({
      key: 'kinds',
      options: { source: () => records },
      type: 'checkbox-card',
    })

    expect(
      [fromFunction, fromPromise, fromQuery, fromSource].map((field) =>
        resolveOptionGroupKey(field),
      ),
    ).toStrictEqual([undefined, undefined, undefined, undefined])
  })

  it('reads the property groupKey names, from any source', () => {
    const fromFunction = defineFormField({
      groupKey: 'section',
      key: 'kind',
      options: () => records,
      type: 'radio-card',
    })
    const mappedInline = defineFormField({
      groupKey: 'section',
      key: 'kind',
      options: records,
      type: 'radio-card',
    })

    expect(resolveOptionGroupKey(fromFunction)).toBe('section')
    expect(resolveOptionGroupKey(mappedInline)).toBe('section')
  })

  it('lists inline options together when groupKey is false', () => {
    const optedOut = defineFormField({
      groupKey: false,
      key: 'kind',
      options: records,
      type: 'checkbox-card',
    })

    expect(resolveOptionGroupKey(optedOut)).toBeUndefined()
  })

  it('applies only to the field kinds that list options under headings', () => {
    const select = defineFormField({ key: 'country', options: records, type: 'select' })

    expect(resolveOptionGroupKey(select)).toBeUndefined()
  })

  it('reads the options source whether or not it is wrapped in a source property', () => {
    expect(readOptionSource(inline)).toBe(records)
    expect(readOptionSource(inlineSource)).toBe(records)
  })
})
