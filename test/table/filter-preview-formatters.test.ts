import { describe, expect, it } from 'vitest'

import type {
  TableDateFilterDefinition,
  TableNumberFilterDefinition,
  TableQueryStateFilterRule,
} from '../../src/runtime/table/types'
import { buildFilterPreview } from '../../src/runtime/table/utils/filters/preview'

describe('filter preview formatters', () => {
  it('uses custom number preview formatters', () => {
    const definition = {
      kind: 'number',
      key: 'salary',
      label: 'Salary',
      preview: {
        label: 'Salary',
        formatter: (value: number) => `$${value.toLocaleString('en-US')}`,
        rangeFormatter: ({ from, to }: { from?: number; to?: number }) =>
          `${from ?? 0} USD -> ${to ?? 0} USD`,
      },
    } satisfies TableNumberFilterDefinition<{ salary: number }, object, 'salary'>

    const scalarRule = {
      key: 'salary',
      operator: 'gte',
      value: 125000,
    } satisfies TableQueryStateFilterRule

    const rangeRule = {
      key: 'salary',
      operator: 'between',
      value: {
        from: 100000,
        to: 150000,
      },
    } satisfies TableQueryStateFilterRule

    expect(buildFilterPreview({ definition, rule: scalarRule }).summary).toBe('Salary: $125,000')
    expect(buildFilterPreview({ definition, rule: rangeRule }).summary).toBe(
      'Salary: 100000 USD -> 150000 USD',
    )
  })

  it('uses custom date preview formatters', () => {
    const definition = {
      kind: 'date',
      key: 'createdAt',
      label: 'Created',
      preview: {
        label: 'Created',
        formatter: (value: Date) => value.toISOString().slice(0, 10),
        rangeFormatter: ({ from, to }: { from?: Date; to?: Date }) =>
          [from, to]
            .filter((value): value is Date => value instanceof Date)
            .map(value => value.toISOString().slice(0, 10))
            .join(' -> '),
      },
    } satisfies TableDateFilterDefinition<{ createdAt: string }, object, 'createdAt'>

    const scalarRule = {
      key: 'createdAt',
      operator: 'is',
      value: new Date('2026-03-19T00:00:00.000Z'),
    } satisfies TableQueryStateFilterRule

    const rangeRule = {
      key: 'createdAt',
      operator: 'between',
      value: {
        from: new Date('2026-03-01T00:00:00.000Z'),
        to: new Date('2026-03-19T00:00:00.000Z'),
      },
    } satisfies TableQueryStateFilterRule

    expect(buildFilterPreview({ definition, rule: scalarRule }).summary).toBe('Created: 2026-03-19')
    expect(buildFilterPreview({ definition, rule: rangeRule }).summary).toBe(
      'Created: 2026-03-01 -> 2026-03-19',
    )
  })
})
