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

  return presetDefinitions.map((preset) => ({
    label: preset.label,
    ...(preset.description ? { description: preset.description } : {}),
    value: resolveScalarPresetValue({
      preset,
      now,
    }),
  }))
}

export function resolveDateFilterRangePresets(options: {
  definition: TableDateFilterDefinition
  now?: Date
}): ResolvedTableDateFilterRangePreset[] {
  const presetDefinitions = getRangePresetDefinitions(options.definition)
  const now = options.now ?? new Date()

  return presetDefinitions.map((preset) => ({
    label: preset.label,
    ...(preset.description ? { description: preset.description } : {}),
    value: resolveRangePresetValue({
      preset,
      now,
    }),
  }))
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
    case 'between':
      return 'Match rows inside a date window.'
    case 'before':
      return 'Match rows before the selected date.'
    case 'after':
      return 'Match rows after the selected date.'
    case 'isNot':
      return 'Exclude rows matching the selected date.'
    default:
      return 'Match rows on the selected date.'
  }
}

function getScalarPresetDefinitions(options: {
  definition: TableDateFilterDefinition
  operator: TableScalarDateFilterOperator
}): TableDateFilterScalarPreset[] {
  const presets = resolveDateFilterUi(options.definition, options.operator).scalar.presets
  if (presets === false) return []
  if (presets == null) return DEFAULT_SCALAR_PRESETS[options.operator]
  if (presets === true) return DEFAULT_SCALAR_PRESETS[options.operator]

  return presets.filter((preset) => {
    if (!preset.operators?.length) return true
    return preset.operators.includes(options.operator)
  })
}

function getRangePresetDefinitions(
  definition: TableDateFilterDefinition,
): TableDateFilterRangePreset[] {
  const presets = resolveDateFilterUi(definition, 'between').range.presets
  if (presets === false) return []
  if (presets == null) return DEFAULT_RANGE_PRESETS
  if (presets === true) return DEFAULT_RANGE_PRESETS
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

function resolveRangePresetValue(options: {
  preset: TableDateFilterRangePreset
  now: Date
}): { from?: Date; to?: Date } {
  if (typeof options.preset.value === 'function') {
    return options.preset.value({
      now: options.now,
    })
  }

  return options.preset.value
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

const DEFAULT_SCALAR_PRESETS: Record<
  TableScalarDateFilterOperator,
  TableDateFilterScalarPreset[]
> = {
  is: [
    {
      label: 'Today',
      description: 'Use the current day.',
      value: ({ now }) => startOfDay(now),
    },
    {
      label: 'Yesterday',
      description: 'Use the previous day.',
      value: ({ now }) => startOfDay(addDays(now, -1)),
    },
    {
      label: 'Start of month',
      description: 'Jump to the first day of this month.',
      value: ({ now }) => startOfMonth(now),
    },
  ],
  isNot: [
    {
      label: 'Today',
      description: 'Exclude the current day.',
      value: ({ now }) => startOfDay(now),
    },
    {
      label: 'Yesterday',
      description: 'Exclude the previous day.',
      value: ({ now }) => startOfDay(addDays(now, -1)),
    },
    {
      label: 'Start of month',
      description: 'Exclude the first day of this month.',
      value: ({ now }) => startOfMonth(now),
    },
  ],
  before: [
    {
      label: 'Today',
      description: 'Everything earlier than today.',
      value: ({ now }) => startOfDay(now),
    },
    {
      label: '7 days ago',
      description: 'Everything earlier than the last 7 days.',
      value: ({ now }) => startOfDay(addDays(now, -7)),
    },
    {
      label: 'Start of month',
      description: 'Everything before this month.',
      value: ({ now }) => startOfMonth(now),
    },
  ],
  after: [
    {
      label: 'Today',
      description: 'Everything after today.',
      value: ({ now }) => startOfDay(now),
    },
    {
      label: '7 days ago',
      description: 'Everything after the last 7 days.',
      value: ({ now }) => startOfDay(addDays(now, -7)),
    },
    {
      label: 'Start of year',
      description: 'Everything after the first day of this year.',
      value: ({ now }) => startOfYear(now),
    },
  ],
}

const DEFAULT_RANGE_PRESETS: TableDateFilterRangePreset[] = [
  {
    label: 'Today',
    description: 'Only the current day.',
    value: ({ now }) => ({
      from: startOfDay(now),
      to: endOfDay(now),
    }),
  },
  {
    label: 'Last 7 days',
    description: 'The previous 7 calendar days.',
    value: ({ now }) => ({
      from: startOfDay(addDays(now, -6)),
      to: endOfDay(now),
    }),
  },
  {
    label: 'Last 30 days',
    description: 'The previous 30 calendar days.',
    value: ({ now }) => ({
      from: startOfDay(addDays(now, -29)),
      to: endOfDay(now),
    }),
  },
  {
    label: 'This month',
    description: 'From the first day of this month until today.',
    value: ({ now }) => ({
      from: startOfMonth(now),
      to: endOfDay(now),
    }),
  },
  {
    label: 'Last month',
    description: 'The full previous month.',
    value: ({ now }) => {
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      return {
        from: startOfMonth(previousMonth),
        to: endOfMonth(previousMonth),
      }
    },
  },
  {
    label: 'Year to date',
    description: 'From the first day of the year until today.',
    value: ({ now }) => ({
      from: startOfYear(now),
      to: endOfDay(now),
    }),
  },
]
