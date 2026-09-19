import { describe, expect, it } from 'vitest'

import type { TableUiFilterDefinition } from '#ui-tools/table/types'
import {
  mergeTableFilterDefaultRules,
  parseTableFilterQueryState,
  resolveTableActiveFilterRules,
  resolveTableFilterDefaultRules,
  serializeTableFilterQueryState,
} from '#ui-tools/table/utils/query-state'

const definitions: TableUiFilterDefinition[] = [
  {
    behavior: { defaultOperator: 'isAnyOf', defaultValue: ['published'] },
    key: 'status',
    kind: 'option',
    label: 'Status',
    source: {
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  },
  {
    behavior: { defaultOperator: 'isAnyOf', defaultValue: ['a4', 'letter'] },
    key: 'format',
    kind: 'option',
    label: 'Format',
    source: {
      options: [
        { label: 'A4', value: 'a4' },
        { label: 'Letter', value: 'letter' },
      ],
    },
  },
]

describe('table filter query defaults', () => {
  it('materializes schema defaults when the URL has no filter values', () => {
    expect(parseTableFilterQueryState({ definitions, entries: new Map() })).toStrictEqual([
      { key: 'status', operator: 'isAnyOf', value: ['published'] },
      { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
    ])
  })

  it('overrides one default from the URL while preserving the others', () => {
    expect(
      parseTableFilterQueryState({
        definitions,
        entries: new Map([['status', ['archived']]]),
      }),
    ).toStrictEqual([
      { key: 'status', operator: 'isAnyOf', value: ['archived'] },
      { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
    ])
  })

  it('keeps untouched defaults when the public API replaces only one filter', () => {
    expect(
      mergeTableFilterDefaultRules({
        definitions,
        rules: [{ key: 'status', operator: 'isAnyOf', value: ['archived'] }],
      }),
    ).toStrictEqual([
      { key: 'status', operator: 'isAnyOf', value: ['archived'] },
      { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
    ])
  })

  it('omits effective defaults from the URL regardless of option order', () => {
    expect(
      serializeTableFilterQueryState({
        definitions,
        rules: [
          { key: 'status', operator: 'isAnyOf', value: ['published'] },
          { key: 'format', operator: 'isAnyOf', value: ['letter', 'a4'] },
        ],
      }),
    ).toStrictEqual(new Map())
  })

  it('serializes an archived override without serializing unchanged defaults', () => {
    expect(
      serializeTableFilterQueryState({
        definitions,
        rules: [
          { key: 'status', operator: 'isAnyOf', value: ['archived'] },
          { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
        ],
      }),
    ).toStrictEqual(new Map([['status', ['archived']]]))
  })

  it('treats effective defaults as inactive and keeps only deviations active', () => {
    expect(
      resolveTableActiveFilterRules({
        definitions,
        rules: [
          { key: 'status', operator: 'isAnyOf', value: ['published'] },
          { key: 'format', operator: 'isAnyOf', value: ['letter', 'a4'] },
        ],
      }),
    ).toStrictEqual([])

    expect(
      resolveTableActiveFilterRules({
        definitions,
        rules: [
          { key: 'status', operator: 'isAnyOf', value: ['published', 'archived'] },
          { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
        ],
      }),
    ).toStrictEqual([{ key: 'status', operator: 'isAnyOf', value: ['published', 'archived'] }])
  })

  it('keeps false and zero defaults while ignoring empty defaults', () => {
    const scalarDefinitions: TableUiFilterDefinition[] = [
      { behavior: { defaultValue: false }, key: 'active', kind: 'boolean', label: 'Active' },
      { behavior: { defaultValue: 0 }, key: 'uses', kind: 'number', label: 'Uses' },
      { behavior: { defaultValue: '' }, key: 'name', kind: 'text', label: 'Name' },
      { behavior: { defaultValue: [] }, key: 'kind', kind: 'option', label: 'Kind' },
    ]

    expect(resolveTableFilterDefaultRules(scalarDefinitions)).toStrictEqual([
      { key: 'active', operator: 'is', value: false },
      { key: 'uses', operator: 'is', value: 0 },
    ])
  })
})
