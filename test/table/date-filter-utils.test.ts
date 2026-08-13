import { describe, expect, it } from 'vitest'

import type { TableDateFilterDefinition } from '#ui-tools/table/types'

import {
  resolveDateFilterRangeCalendarPanels,
  resolveDateFilterRangePresets,
  resolveDateFilterScalarPresets,
} from '../../src/runtime/table/utils/filters/date'

type TestRow = {
  createdAt: string
}

const baseDefinition = {
  kind: 'date',
  key: 'createdAt',
  label: 'Created at',
} satisfies TableDateFilterDefinition<TestRow, object, 'createdAt'>

describe('date filter utils', () => {
  it('returns default scalar presets when no custom config is provided', () => {
    const now = new Date('2026-03-19T10:00:00.000Z')

    const presets = resolveDateFilterScalarPresets({
      definition: baseDefinition,
      operator: 'before',
      now,
    })

    expect(presets.map((preset) => preset.label)).toEqual(['Today', '7 days ago', 'Start of month'])
    expect(presets[1]?.value.getFullYear()).toBe(2026)
    expect(presets[1]?.value.getMonth()).toBe(2)
    expect(presets[1]?.value.getDate()).toBe(12)
  })

  it('supports operator-specific custom scalar presets', () => {
    const definition = {
      ...baseDefinition,
      editor: {
        operators: {
          after: {
            scalar: {
              presets: [
                {
                  label: 'Start of year',
                  value: ({ now }: { now: Date }) => new Date(now.getFullYear(), 0, 1),
                },
              ],
            },
          },
        },
      },
    } satisfies TableDateFilterDefinition<TestRow, object, 'createdAt'>

    const presets = resolveDateFilterScalarPresets({
      definition,
      operator: 'after',
      now: new Date('2026-03-19T10:00:00.000Z'),
    })

    expect(presets.map((preset) => preset.label)).toEqual(['Start of year'])
  })

  it('returns default range presets and responsive panel defaults', () => {
    const now = new Date('2026-03-19T10:00:00.000Z')

    const presets = resolveDateFilterRangePresets({
      definition: baseDefinition,
      now,
    })

    expect(presets.map((preset) => preset.label)).toEqual([
      'Today',
      'Last 7 days',
      'Last 30 days',
      'This month',
      'Last month',
      'Year to date',
    ])
    expect(resolveDateFilterRangeCalendarPanels({ definition: baseDefinition, mobile: true })).toBe(
      1,
    )
    expect(
      resolveDateFilterRangeCalendarPanels({ definition: baseDefinition, mobile: false }),
    ).toBe(1)
  })

  it('allows disabling presets and overriding responsive panel counts', () => {
    const definition = {
      ...baseDefinition,
      editor: {
        scalar: {
          presets: false,
        },
        range: {
          presets: false,
          calendar: {
            months: {
              mobile: 2,
              desktop: 1,
            },
          },
        },
      },
    } satisfies TableDateFilterDefinition<TestRow, object, 'createdAt'>

    expect(resolveDateFilterScalarPresets({ definition, operator: 'is' })).toEqual([])
    expect(resolveDateFilterRangePresets({ definition })).toEqual([])
    expect(resolveDateFilterRangeCalendarPanels({ definition, mobile: true })).toBe(2)
    expect(resolveDateFilterRangeCalendarPanels({ definition, mobile: false })).toBe(1)
  })

  it('reads range presets and calendar settings from the editor config', () => {
    const definition = {
      ...baseDefinition,
      editor: {
        range: {
          presets: false,
          calendar: {
            months: 2,
            pagedNavigation: true,
          },
        },
      },
    } satisfies TableDateFilterDefinition<TestRow, object, 'createdAt'>

    expect(resolveDateFilterRangePresets({ definition })).toEqual([])
    expect(resolveDateFilterRangeCalendarPanels({ definition, mobile: true })).toBe(2)
    expect(resolveDateFilterRangeCalendarPanels({ definition, mobile: false })).toBe(2)
  })
})
