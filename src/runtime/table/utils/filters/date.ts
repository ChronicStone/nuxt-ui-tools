import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { isFunction, isNullish } from '../../../shared/utils/predicate'
import type {
  TableDateFilterDefinition,
  TableDateFilterOperator,
  TableDateFilterRangePreset,
  TableDateFilterScalarPreset,
  TableScalarDateFilterOperator,
} from '../../types'
import { resolveDateFilterUi } from './ui'

export interface ResolvedTableDateFilterScalarPreset {
  label: string
  description?: string
  value: Date
}

export interface ResolvedTableDateFilterRangePreset {
  label: string
  description?: string
  value: {
    from?: Date
    to?: Date
  }
}

export function resolveDateFilterScalarPresets(options: {
  definition: TableDateFilterDefinition
  operator: TableScalarDateFilterOperator
  now?: Date
}): ResolvedTableDateFilterScalarPreset[] {
  const presetDefinitions = getScalarPresetDefinitions(options)
  const now = options.now ?? new Date()

  return presetDefinitions.map((preset) => {
    const resolved: ResolvedTableDateFilterScalarPreset = {
      label: resolveTextValue(preset.label),
      value: resolveScalarPresetValue({ now, preset }),
    }
    if (preset.description) {
      resolved.description = resolveTextValue(preset.description)
    }
    return resolved
  })
}

export function resolveDateFilterRangePresets(options: {
  definition: TableDateFilterDefinition
  now?: Date
}): ResolvedTableDateFilterRangePreset[] {
  const presetDefinitions = getRangePresetDefinitions(options.definition)
  const now = options.now ?? new Date()

  return presetDefinitions.map((preset) => {
    const resolved: ResolvedTableDateFilterRangePreset = {
      label: resolveTextValue(preset.label),
      value: resolveRangePresetValue({ now, preset }),
    }
    if (preset.description) {
      resolved.description = resolveTextValue(preset.description)
    }
    return resolved
  })
}

export function resolveDateFilterRangeCalendarPanels(options: {
  definition: TableDateFilterDefinition
  mobile: boolean
}): 1 | 2 {
  const panels = resolveDateFilterUi(options.definition, 'between').range.calendar.months

  if (panels === 1 || panels === 2) {
    return panels
  }

  if (!panels) {
    return 1
  }

  if (options.mobile) {
    return panels.mobile ?? panels.desktop ?? 1
  }

  return panels.desktop ?? panels.mobile ?? 2
}

export function resolveDateFilterOperatorDescription(
  operator: TableDateFilterOperator | undefined,
): string {
  switch (operator) {
    case 'between': {
      return 'Match rows inside a date window.'
    }
    case 'before': {
      return 'Match rows before the selected date.'
    }
    case 'after': {
      return 'Match rows after the selected date.'
    }
    case 'isNot': {
      return 'Exclude rows matching the selected date.'
    }
    default: {
      return 'Match rows on the selected date.'
    }
  }
}

function getScalarPresetDefinitions(options: {
  definition: TableDateFilterDefinition
  operator: TableScalarDateFilterOperator
}): TableDateFilterScalarPreset[] {
  const { presets } = resolveDateFilterUi(options.definition, options.operator).scalar
  if (presets === false) {
    return []
  }
  if (isNullish(presets)) {
    return DEFAULT_SCALAR_PRESETS[options.operator]
  }
  if (presets === true) {
    return DEFAULT_SCALAR_PRESETS[options.operator]
  }

  return presets.filter((preset) => {
    if (!preset.operators?.length) {
      return true
    }
    return preset.operators.includes(options.operator)
  })
}

function getRangePresetDefinitions(
  definition: TableDateFilterDefinition,
): TableDateFilterRangePreset[] {
  const { presets } = resolveDateFilterUi(definition, 'between').range
  if (presets === false) {
    return []
  }
  if (isNullish(presets)) {
    return DEFAULT_RANGE_PRESETS
  }
  if (presets === true) {
    return DEFAULT_RANGE_PRESETS
  }
  return presets
}

function resolveScalarPresetValue(options: {
  preset: TableDateFilterScalarPreset
  now: Date
}): Date {
  if (options.preset.value instanceof Date) {
    return options.preset.value
  }

  return options.preset.value({
    now: options.now,
  })
}

function resolveRangePresetValue(options: { preset: TableDateFilterRangePreset; now: Date }): {
  from?: Date
  to?: Date
} {
  if (isRangePresetResolver(options.preset.value)) {
    return options.preset.value({
      now: options.now,
    })
  }

  return options.preset.value
}

function isRangePresetResolver(
  value: TableDateFilterRangePreset['value'],
): value is (context: { now: Date }) => { from?: Date; to?: Date } {
  return isFunction(value)
}

function startOfDay(value: Date): Date {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(value: Date): Date {
  const result = new Date(value)
  result.setHours(23, 59, 59, 999)
  return result
}

function addDays(value: Date, amount: number): Date {
  const result = new Date(value)
  result.setDate(result.getDate() + amount)
  return result
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999)
}

function startOfYear(value: Date): Date {
  return new Date(value.getFullYear(), 0, 1)
}

const DEFAULT_SCALAR_PRESETS = {
  after: [
    {
      description: 'Everything after today.',
      label: 'Today',
      value: ({ now }) => startOfDay(now),
    },
    {
      description: 'Everything after the last 7 days.',
      label: '7 days ago',
      value: ({ now }) => startOfDay(addDays(now, -7)),
    },
    {
      description: 'Everything after the first day of this year.',
      label: 'Start of year',
      value: ({ now }) => startOfYear(now),
    },
  ],
  before: [
    {
      description: 'Everything earlier than today.',
      label: 'Today',
      value: ({ now }) => startOfDay(now),
    },
    {
      description: 'Everything earlier than the last 7 days.',
      label: '7 days ago',
      value: ({ now }) => startOfDay(addDays(now, -7)),
    },
    {
      description: 'Everything before this month.',
      label: 'Start of month',
      value: ({ now }) => startOfMonth(now),
    },
  ],
  is: [
    {
      description: 'Use the current day.',
      label: 'Today',
      value: ({ now }) => startOfDay(now),
    },
    {
      description: 'Use the previous day.',
      label: 'Yesterday',
      value: ({ now }) => startOfDay(addDays(now, -1)),
    },
    {
      description: 'Jump to the first day of this month.',
      label: 'Start of month',
      value: ({ now }) => startOfMonth(now),
    },
  ],
  isNot: [
    {
      description: 'Exclude the current day.',
      label: 'Today',
      value: ({ now }) => startOfDay(now),
    },
    {
      description: 'Exclude the previous day.',
      label: 'Yesterday',
      value: ({ now }) => startOfDay(addDays(now, -1)),
    },
    {
      description: 'Exclude the first day of this month.',
      label: 'Start of month',
      value: ({ now }) => startOfMonth(now),
    },
  ],
} satisfies Record<TableScalarDateFilterOperator, TableDateFilterScalarPreset[]>

const DEFAULT_RANGE_PRESETS: TableDateFilterRangePreset[] = [
  {
    description: 'Only the current day.',
    label: 'Today',
    value: ({ now }) => ({
      from: startOfDay(now),
      to: endOfDay(now),
    }),
  },
  {
    description: 'The previous 7 calendar days.',
    label: 'Last 7 days',
    value: ({ now }) => ({
      from: startOfDay(addDays(now, -6)),
      to: endOfDay(now),
    }),
  },
  {
    description: 'The previous 30 calendar days.',
    label: 'Last 30 days',
    value: ({ now }) => ({
      from: startOfDay(addDays(now, -29)),
      to: endOfDay(now),
    }),
  },
  {
    description: 'From the first day of this month until today.',
    label: 'This month',
    value: ({ now }) => ({
      from: startOfMonth(now),
      to: endOfDay(now),
    }),
  },
  {
    description: 'The full previous month.',
    label: 'Last month',
    value: ({ now }) => {
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      return {
        from: startOfMonth(previousMonth),
        to: endOfMonth(previousMonth),
      }
    },
  },
  {
    description: 'From the first day of the year until today.',
    label: 'Year to date',
    value: ({ now }) => ({
      from: startOfYear(now),
      to: endOfDay(now),
    }),
  },
]
