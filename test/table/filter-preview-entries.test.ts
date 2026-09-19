import { describe, expect, it } from 'vitest'

import type {
  TableBooleanFilterDefinition,
  TableOptionFilterDefinition,
  TableTextFilterDefinition,
} from '#ui-tools/table/types'
import { buildFilterPreview } from '#ui-tools/table/utils/filters/preview'

const optionDefinition = {
  key: 'status',
  kind: 'option',
  label: 'Status',
  source: { options: [] },
} as unknown as TableOptionFilterDefinition
const entries = [
  { color: '#f90', label: 'Active', value: 'active' },
  { color: '#bbb', label: 'Pending', value: 'pending' },
  { label: 'Inactive', value: 'inactive' },
  { icon: 'i-lucide-archive', label: 'Archived', value: 'archived' },
]

describe('option previews', () => {
  it('keeps entries with colours for a single selected value', () => {
    const preview = buildFilterPreview({
      definition: optionDefinition,
      optionEntries: entries,
      rule: { key: 'status', operator: 'isAnyOf', value: ['active'] },
    })
    expect(preview).toStrictEqual({
      active: true,
      count: 1,
      entries: [{ color: '#f90', icon: undefined, label: 'Active' }],
      summary: '',
      tags: ['Active'],
    })
  })

  it('caps tags at three and summarises the overflow', () => {
    const preview = buildFilterPreview({
      definition: optionDefinition,
      optionEntries: entries,
      rule: { key: 'status', value: ['active', 'pending', 'inactive', 'archived'] },
    })
    expect(preview.count).toBe(4)
    expect(preview.tags).toStrictEqual(['Active', 'Pending', 'Inactive'])
    expect(preview.entries.map((entry) => entry.color)).toStrictEqual(['#f90', '#bbb', undefined])
    expect(preview.summary).toBe('+1')
  })

  it('falls back to the raw value without a matching entry and honours summary mode', () => {
    expect(
      buildFilterPreview({
        definition: optionDefinition,
        optionEntries: entries,
        rule: { key: 'status', value: 'ghost' },
      }).tags,
    ).toStrictEqual(['ghost'])
    const summaryDefinition = {
      ...optionDefinition,
      preview: { label: 'Statut', mode: 'summary' },
    } as unknown as TableOptionFilterDefinition
    const preview = buildFilterPreview({
      definition: summaryDefinition,
      optionEntries: entries,
      rule: { key: 'status', value: ['active', 'pending'] },
    })
    expect(preview).toMatchObject({
      count: 2,
      entries: [],
      summary: 'Statut: Active, Pending',
      tags: [],
    })
  })

  it('returns an inactive empty preview without a rule', () => {
    expect(buildFilterPreview({ definition: optionDefinition })).toStrictEqual({
      active: false,
      count: 0,
      entries: [],
      summary: '',
      tags: [],
    })
  })
})

describe('boolean and text previews', () => {
  it('labels booleans through the locale and custom editor labels', () => {
    const definition = {
      key: 'flag',
      kind: 'boolean',
      label: 'Flag',
    } as unknown as TableBooleanFilterDefinition
    expect(buildFilterPreview({ definition, rule: { key: 'flag', value: true } })).toMatchObject({
      count: 1,
      summary: 'Yes',
      tags: [],
    })
    expect(buildFilterPreview({ definition, rule: { key: 'flag', value: false } }).summary).toBe(
      'No',
    )
    const custom = {
      ...definition,
      editor: { labels: { false: 'Off', true: 'On' } },
    } as unknown as TableBooleanFilterDefinition
    expect(
      buildFilterPreview({ definition: custom, rule: { key: 'flag', value: false } }).summary,
    ).toBe('Off')
  })

  it('summarises text rules and multi-value text selections', () => {
    const definition = {
      key: 'name',
      kind: 'text',
      label: 'Name',
    } as unknown as TableTextFilterDefinition
    expect(
      buildFilterPreview({ definition, rule: { key: 'name', operator: 'contains', value: 'ada' } }),
    ).toMatchObject({ active: true, count: 1, summary: 'ada', tags: [] })
    expect(
      buildFilterPreview({ definition, rule: { key: 'name', value: ['a', 'b'] } }).summary,
    ).toBe('2 selected')
    expect(buildFilterPreview({ definition, rule: { key: 'name', value: '' } }).active).toBeFalsy()
  })
})
