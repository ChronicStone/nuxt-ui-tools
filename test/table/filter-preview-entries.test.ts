import { describe, expect, it } from 'vitest'

import type { TableBooleanFilterDefinition, TableOptionFilterDefinition, TableTextFilterDefinition } from '#ui-tools/table/types'
import { buildFilterPreview } from '#ui-tools/table/utils/filters/preview'

const optionDefinition = {
  kind: 'option',
  key: 'status',
  label: 'Status',
  source: { options: [] },
} as unknown as TableOptionFilterDefinition
const entries = [
  { label: 'Active', value: 'active', color: '#f90' },
  { label: 'Pending', value: 'pending', color: '#bbb' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived', icon: 'i-lucide-archive' },
]

describe('option previews', () => {
  it('keeps entries with colours for a single selected value', () => {
    const preview = buildFilterPreview({ definition: optionDefinition, rule: { key: 'status', operator: 'isAnyOf', value: ['active'] }, optionEntries: entries })
    expect(preview).toEqual({ active: true, count: 1, tags: ['Active'], entries: [{ label: 'Active', icon: undefined, color: '#f90' }], summary: '' })
  })

  it('caps tags at three and summarises the overflow', () => {
    const preview = buildFilterPreview({ definition: optionDefinition, rule: { key: 'status', value: ['active', 'pending', 'inactive', 'archived'] }, optionEntries: entries })
    expect(preview.count).toBe(4)
    expect(preview.tags).toEqual(['Active', 'Pending', 'Inactive'])
    expect(preview.entries.map((entry) => entry.color)).toEqual(['#f90', '#bbb', undefined])
    expect(preview.summary).toBe('+1')
  })

  it('falls back to the raw value without a matching entry and honours summary mode', () => {
    expect(buildFilterPreview({ definition: optionDefinition, rule: { key: 'status', value: 'ghost' }, optionEntries: entries }).tags).toEqual(['ghost'])
    const summaryDefinition = { ...optionDefinition, preview: { mode: 'summary', label: 'Statut' } } as unknown as TableOptionFilterDefinition
    const preview = buildFilterPreview({ definition: summaryDefinition, rule: { key: 'status', value: ['active', 'pending'] }, optionEntries: entries })
    expect(preview).toMatchObject({ tags: [], entries: [], summary: 'Statut: Active, Pending', count: 2 })
  })

  it('returns an inactive empty preview without a rule', () => {
    expect(buildFilterPreview({ definition: optionDefinition })).toEqual({ active: false, count: 0, tags: [], entries: [], summary: '' })
  })
})

describe('boolean and text previews', () => {
  it('labels booleans through the locale and custom editor labels', () => {
    const definition = { kind: 'boolean', key: 'flag', label: 'Flag' } as unknown as TableBooleanFilterDefinition
    expect(buildFilterPreview({ definition, rule: { key: 'flag', value: true } })).toMatchObject({ summary: 'Yes', tags: [], count: 1 })
    expect(buildFilterPreview({ definition, rule: { key: 'flag', value: false } }).summary).toBe('No')
    const custom = { ...definition, editor: { labels: { true: 'On', false: 'Off' } } } as unknown as TableBooleanFilterDefinition
    expect(buildFilterPreview({ definition: custom, rule: { key: 'flag', value: false } }).summary).toBe('Off')
  })

  it('summarises text rules and multi-value text selections', () => {
    const definition = { kind: 'text', key: 'name', label: 'Name' } as unknown as TableTextFilterDefinition
    expect(buildFilterPreview({ definition, rule: { key: 'name', operator: 'contains', value: 'ada' } })).toMatchObject({ active: true, count: 1, summary: 'ada', tags: [] })
    expect(buildFilterPreview({ definition, rule: { key: 'name', value: ['a', 'b'] } }).summary).toBe('2 selected')
    expect(buildFilterPreview({ definition, rule: { key: 'name', value: '' } }).active).toBe(false)
  })
})
