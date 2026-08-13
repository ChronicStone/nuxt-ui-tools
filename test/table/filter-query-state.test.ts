import { describe, expect, it } from 'vitest'

import type { TableUiFilterDefinition } from '#ui-tools/table/types'
import {
  mergeTableFilterDefaultRules,
  parseTableFilterQueryState,
  resolveTableFilterDefaultRules,
  serializeTableFilterQueryState,
} from '#ui-tools/table/utils/query-state'

const definitions: TableUiFilterDefinition[] = [
  {
    kind: 'option',
    key: 'status',
    label: 'Status',
    behavior: { defaultOperator: 'isAnyOf', defaultValue: ['published'] },
    source: {
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  },
  {
    kind: 'option',
    key: 'format',
    label: 'Format',
    behavior: { defaultOperator: 'isAnyOf', defaultValue: ['a4', 'letter'] },
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
    expect(parseTableFilterQueryState({ entries: new Map(), definitions })).toEqual([
      { key: 'status', operator: 'isAnyOf', value: ['published'] },
      { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
    ])
  })

  it('overrides one default from the URL while preserving the others', () => {
    expect(
      parseTableFilterQueryState({
        entries: new Map([['status', ['archived']]]),
        definitions,
      }),
    ).toEqual([
      { key: 'status', operator: 'isAnyOf', value: ['archived'] },
      { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
    ])
  })

  it('keeps untouched defaults when the public API replaces only one filter', () => {
    expect(
      mergeTableFilterDefaultRules({
        rules: [{ key: 'status', operator: 'isAnyOf', value: ['archived'] }],
        definitions,
      }),
    ).toEqual([
      { key: 'status', operator: 'isAnyOf', value: ['archived'] },
      { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
    ])
  })

  it('omits effective defaults from the URL regardless of option order', () => {
    expect(
      serializeTableFilterQueryState({
        rules: [
          { key: 'status', operator: 'isAnyOf', value: ['published'] },
          { key: 'format', operator: 'isAnyOf', value: ['letter', 'a4'] },
        ],
        definitions,
      }),
    ).toEqual(new Map())
  })

  it('serializes an archived override without serializing unchanged defaults', () => {
    expect(
      serializeTableFilterQueryState({
        rules: [
          { key: 'status', operator: 'isAnyOf', value: ['archived'] },
          { key: 'format', operator: 'isAnyOf', value: ['a4', 'letter'] },
        ],
        definitions,
      }),
    ).toEqual(new Map([['status', ['archived']]]))
  })

  it('keeps false and zero defaults while ignoring empty defaults', () => {
    const scalarDefinitions: TableUiFilterDefinition[] = [
      { kind: 'boolean', key: 'active', label: 'Active', behavior: { defaultValue: false } },
      { kind: 'number', key: 'uses', label: 'Uses', behavior: { defaultValue: 0 } },
      { kind: 'text', key: 'name', label: 'Name', behavior: { defaultValue: '' } },
      { kind: 'option', key: 'kind', label: 'Kind', behavior: { defaultValue: [] } },
    ]

    expect(resolveTableFilterDefaultRules(scalarDefinitions)).toEqual([
      { key: 'active', operator: 'is', value: false },
      { key: 'uses', operator: 'is', value: 0 },
    ])
  })
})
