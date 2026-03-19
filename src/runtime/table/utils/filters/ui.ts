import type {
  TableBooleanFilterDefinition,
  TableBooleanFilterOperator,
  TableBooleanFilterUiResolved,
  TableDateFilterDefinition,
  TableDateFilterOperator,
  TableDateFilterPreviewConfig,
  TableDateFilterPreviewConfigResolved,
  TableDateFilterUiRangeConfig,
  TableDateFilterUiResolved,
  TableDateFilterUiScalarConfig,
  TableFilterPreviewConfig,
  TableFilterPreviewConfigResolved,
  TableFilterPreviewMode,
  TableFilterUiActionLabelsResolved,
  TableTextValue,
  TableNumberFilterPreviewConfig,
  TableNumberFilterPreviewConfigResolved,
  TableNumberFilterUiRangeConfig,
  TableNumberFilterUiScalarConfig,
  TableNumberFilterDefinition,
  TableNumberFilterOperator,
  TableNumberFilterUiResolved,
  GenericObject,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableOptionFilterUiResolved,
  TableTagFilterPreviewConfig,
  TableTagFilterPreviewConfigResolved,
  TableTextFilterDefinition,
  TableTextFilterOperator,
  TableTextFilterUiResolved,
} from '../../types'
import { getFilterLabelText, getFilterTextValue } from './common'

export function resolveTextFilterUi(
  definition: TableTextFilterDefinition,
  operator: TableTextFilterOperator | undefined,
): TableTextFilterUiResolved {
  const override = operator ? definition.ui?.operators?.[operator] : undefined

  return {
    commitMode: definition.ui?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.ui?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.ui?.reopenOnOperatorChange ?? true,
    actions: resolveActions({ common: definition.ui?.actions }),
    placeholder: getFilterTextValue({
      value: override?.placeholder ?? definition.ui?.placeholder,
      fallback: getFilterLabelText({ label: definition.label }),
    }),
    inputType: definition.ui?.inputType ?? 'text',
    leadingIcon: definition.ui?.leadingIcon ?? 'i-lucide-search',
    autocomplete: definition.ui?.autocomplete ?? 'off',
    input: {
      autofocus: definition.ui?.input?.autofocus ?? false,
      highlight: definition.ui?.input?.highlight ?? false,
      fixed: definition.ui?.input?.fixed ?? false,
    },
    preview: resolvePreview({
      base: definition.ui?.preview,
      operator: override?.preview,
      empty: 'Select…',
      mode: 'summary',
    }),
  }
}

export function resolveOptionFilterUi(
  definition: TableOptionFilterDefinition<GenericObject, GenericObject, string>,
  operator: TableOptionFilterOperator | undefined,
): TableOptionFilterUiResolved {
  const override = operator ? definition.ui?.operators?.[operator] : undefined
  const selection = {
    ...definition.ui?.selection,
    ...override?.selection,
  }
  const tree = definition.ui?.presentation === 'tree' ? definition.ui.tree : undefined
  const row = {
    ...definition.ui?.row,
    ...override?.row,
  }
  const labels = {
    ...definition.ui?.labels,
    ...override?.labels,
  }
  const mode = resolveOptionSelectionMode({
    configured: selection.mode,
    operator,
  })

  return {
    commitMode: definition.ui?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.ui?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.ui?.reopenOnOperatorChange ?? true,
    actions: resolveActions({
      common: definition.ui?.actions,
      local: labels,
    }),
    searchable: definition.ui?.searchable ?? true,
    closeOnSelect: definition.ui?.closeOnSelect ?? false,
    presentation: definition.ui?.presentation ?? 'list',
    tree: {
      selectable: tree?.selectable ?? 'all',
      expandedByDefault: tree?.expandedByDefault ?? false,
      searchMode: tree?.searchMode ?? 'auto',
    },
    selection: {
      mode,
      allowEmpty: selection.allowEmpty ?? true,
      max: selection.max,
    },
    row: {
      showCounts: row.showCounts ?? true,
      selectedIcon: row.selectedIcon ?? 'i-lucide-check',
      truncate: row.truncate ?? true,
      getIcon: row.getIcon,
    },
    labels: {
      searchPlaceholder: getFilterTextValue({
        value: labels.searchPlaceholder,
        fallback: getFilterLabelText({ label: definition.label }),
      }),
      empty: getFilterTextValue({
        value: labels.empty,
        fallback: 'No matching options.',
      }),
    },
    preview: resolveTagPreview({
      base: definition.ui?.preview,
      operator: override?.preview,
      empty: 'Select…',
      mode: 'auto',
      maxTags: 1,
    }),
  }
}

export function resolveBooleanFilterUi(
  definition: TableBooleanFilterDefinition,
  operator: TableBooleanFilterOperator | undefined,
): TableBooleanFilterUiResolved {
  const override = operator ? definition.ui?.operators?.[operator] : undefined
  const labels = {
    ...definition.ui?.labels,
    ...override?.labels,
  }
  const icons = {
    ...definition.ui?.icons,
    ...override?.icons,
  }
  const selection = {
    ...definition.ui?.selection,
    ...override?.selection,
  }

  return {
    commitMode: definition.ui?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.ui?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.ui?.reopenOnOperatorChange ?? true,
    actions: resolveActions({
      common: definition.ui?.actions,
      local: labels,
    }),
    labels: {
      true: getFilterTextValue({
        value: labels.true,
        fallback: 'Yes',
      }),
      false: getFilterTextValue({
        value: labels.false,
        fallback: 'No',
      }),
      empty: getFilterTextValue({
        value: labels.empty,
        fallback: 'Select…',
      }),
    },
    icons: {
      true: icons.true,
      false: icons.false,
    },
    selection: {
      allowEmpty: selection.allowEmpty ?? true,
    },
    preview: resolveTagPreview({
      base: definition.ui?.preview,
      operator: override?.preview,
      empty: getFilterTextValue({
        value: labels.empty,
        fallback: 'Select…',
      }),
      mode: 'summary',
      maxTags: 1,
    }),
  }
}

export function resolveNumberFilterUi(
  definition: TableNumberFilterDefinition,
  operator: TableNumberFilterOperator | undefined,
): TableNumberFilterUiResolved {
  const operatorOverride = operator ? definition.ui?.operators?.[operator] : undefined
  const scalarOverride = getNumberScalarOperatorOverride(definition, operator)
  const rangeOverride = getNumberRangeOperatorOverride(definition, operator)
  const scalar = mergeNumberScalarConfig(definition.ui?.scalar, scalarOverride)
  const range = mergeNumberRangeConfig(definition.ui?.range, rangeOverride)

  return {
    commitMode: definition.ui?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.ui?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.ui?.reopenOnOperatorChange ?? true,
    actions: resolveActions({ common: definition.ui?.actions }),
    min: definition.ui?.min,
    max: definition.ui?.max,
    step: definition.ui?.step ?? 1,
    formatOptions: definition.ui?.formatOptions,
    preview: resolveNumberPreview({
      base: definition.ui?.preview,
      branch: operator === 'between' ? range.preview : scalar.preview,
      operator: operatorOverride?.preview,
      empty: 'Select…',
      mode: 'summary',
    }),
    scalar: {
      display: scalar.display ?? 'input',
      input: {
        placeholder: getFilterTextValue({
          value: scalar.input?.placeholder,
          fallback: getFilterLabelText({ label: definition.label }),
        }),
        hideStepper: scalar.input?.hideStepper ?? false,
        disableWheelChange: scalar.input?.disableWheelChange ?? true,
      },
      slider: {
        min: scalar.slider?.min ?? definition.ui?.min,
        max: scalar.slider?.max ?? definition.ui?.max,
        step: scalar.slider?.step ?? definition.ui?.step,
        showTooltip: scalar.slider?.showTooltip ?? true,
      },
      preview: resolveNumberPreview({
        base: definition.ui?.preview,
        branch: definition.ui?.scalar?.preview,
        operator: operator !== 'between' ? operatorOverride?.preview : undefined,
        empty: 'Select…',
        mode: 'summary',
      }),
    },
    range: {
      display: range.display ?? 'inputs',
      minGap: range.minGap,
      inputs: {
        fromPlaceholder: getFilterTextValue({
          value: range.inputs?.fromPlaceholder,
          fallback: 'Min',
        }),
        toPlaceholder: getFilterTextValue({
          value: range.inputs?.toPlaceholder,
          fallback: 'Max',
        }),
        hideStepper: range.inputs?.hideStepper ?? false,
        disableWheelChange: range.inputs?.disableWheelChange ?? true,
      },
      slider: {
        min: range.slider?.min ?? definition.ui?.min,
        max: range.slider?.max ?? definition.ui?.max,
        step: range.slider?.step ?? definition.ui?.step,
        showTooltip: range.slider?.showTooltip ?? true,
      },
      preview: resolveNumberPreview({
        base: definition.ui?.preview,
        branch: definition.ui?.range?.preview,
        operator: operator === 'between' ? operatorOverride?.preview : undefined,
        empty: 'Select…',
        mode: 'summary',
      }),
    },
  }
}

export function resolveDateFilterUi(
  definition: TableDateFilterDefinition,
  operator: TableDateFilterOperator | undefined,
): TableDateFilterUiResolved {
  const legacy = definition.picker
  const operatorOverride = operator ? definition.ui?.operators?.[operator] : undefined
  const scalarOverride = getDateScalarOperatorOverride(definition, operator)
  const rangeOverride = getDateRangeOperatorOverride(definition, operator)
  const scalar = mergeDateScalarConfig(definition.ui?.scalar, scalarOverride)
  const range = mergeDateRangeConfig(definition.ui?.range, rangeOverride)

  return {
    commitMode: definition.ui?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.ui?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.ui?.reopenOnOperatorChange ?? true,
    actions: resolveActions({ common: definition.ui?.actions }),
    preview: resolveDatePreview({
      base: definition.ui?.preview,
      branch: operator === 'between' ? range.preview : scalar.preview,
      operator: operatorOverride?.preview,
      empty: 'Select…',
      mode: 'summary',
    }),
    scalar: {
      display: scalar.display ?? 'calendar',
      presets: scalar.presets ?? legacy?.scalarPresets,
      input: {
        placeholder: getFilterTextValue({
          value: scalar.input?.placeholder,
          fallback: getFilterLabelText({ label: definition.label }),
        }),
        granularity: scalar.input?.granularity ?? 'day',
        hideTimeZone: scalar.input?.hideTimeZone ?? true,
        hourCycle: scalar.input?.hourCycle,
        fixed: scalar.input?.fixed ?? true,
        highlight: scalar.input?.highlight ?? false,
      },
      calendar: {
        months: scalar.calendar?.months,
        pagedNavigation: scalar.calendar?.pagedNavigation,
        fixedWeeks: scalar.calendar?.fixedWeeks ?? true,
        min: scalar.calendar?.min,
        max: scalar.calendar?.max,
        maxRangeDays: scalar.calendar?.maxRangeDays,
      },
      preview: resolveDatePreview({
        base: definition.ui?.preview,
        branch: definition.ui?.scalar?.preview,
        operator: operator !== 'between' ? operatorOverride?.preview : undefined,
        empty: 'Select…',
        mode: 'summary',
      }),
    },
    range: {
      display: range.display ?? 'inputs-calendar',
      presets: range.presets ?? legacy?.rangePresets,
      presetsPlacement: range.presetsPlacement ?? 'side',
      input: {
        fromPlaceholder: getFilterTextValue({
          value: range.input?.fromPlaceholder,
          fallback: 'Start date',
        }),
        toPlaceholder: getFilterTextValue({
          value: range.input?.toPlaceholder,
          fallback: 'End date',
        }),
        granularity: range.input?.granularity ?? 'day',
        hideTimeZone: range.input?.hideTimeZone ?? true,
        hourCycle: range.input?.hourCycle,
        fixed: range.input?.fixed ?? true,
        highlight: range.input?.highlight ?? false,
      },
      calendar: {
        months: range.calendar?.months ?? legacy?.rangeCalendar?.panels,
        pagedNavigation: range.calendar?.pagedNavigation ?? legacy?.rangeCalendar?.pagedNavigation,
        fixedWeeks: range.calendar?.fixedWeeks ?? true,
        min: range.calendar?.min,
        max: range.calendar?.max,
        maxRangeDays: range.calendar?.maxRangeDays,
      },
      preview: resolveDatePreview({
        base: definition.ui?.preview,
        branch: definition.ui?.range?.preview,
        operator: operator === 'between' ? operatorOverride?.preview : undefined,
        empty: 'Select…',
        mode: 'summary',
      }),
    },
  }
}

function resolveActions(options: {
  common?: { clear?: TableTextValue; apply?: TableTextValue }
  local?: { clear?: TableTextValue; apply?: TableTextValue }
}): TableFilterUiActionLabelsResolved {
  return {
    clear: getFilterTextValue({
      value: options.local?.clear ?? options.common?.clear,
      fallback: 'Clear',
    }),
    apply: getFilterTextValue({
      value: options.local?.apply ?? options.common?.apply,
      fallback: 'Apply',
    }),
  }
}

function resolvePreview(options: {
  base?: TableFilterPreviewConfig
  branch?: TableFilterPreviewConfig
  operator?: TableFilterPreviewConfig
  empty: string
  mode: 'summary' | 'tags'
}): TableFilterPreviewConfigResolved {
  return {
    mode: options.operator?.mode ?? options.branch?.mode ?? options.base?.mode ?? options.mode,
    label: getFilterTextValue({
      value: options.operator?.label ?? options.branch?.label ?? options.base?.label,
    }),
    empty: getFilterTextValue({
      value: options.operator?.empty ?? options.branch?.empty ?? options.base?.empty,
      fallback: options.empty,
    }),
  }
}

function resolveTagPreview(options: {
  base?: TableTagFilterPreviewConfig
  operator?: TableTagFilterPreviewConfig
  empty: string
  mode: TableFilterPreviewMode
  maxTags: number
}): TableTagFilterPreviewConfigResolved {
  return {
    mode: options.operator?.mode ?? options.base?.mode ?? options.mode,
    label: getFilterTextValue({
      value: options.operator?.label ?? options.base?.label,
    }),
    empty: getFilterTextValue({
      value: options.operator?.empty ?? options.base?.empty,
      fallback: options.empty,
    }),
    maxTags: options.operator?.maxTags ?? options.base?.maxTags ?? options.maxTags,
  }
}

function resolveNumberPreview(options: {
  base?: TableNumberFilterPreviewConfig
  branch?: TableNumberFilterPreviewConfig
  operator?: TableNumberFilterPreviewConfig
  empty: string
  mode: 'summary' | 'tags'
}): TableNumberFilterPreviewConfigResolved {
  const base = resolvePreview(options)

  return {
    ...base,
    formatter: options.operator?.formatter ?? options.branch?.formatter ?? options.base?.formatter,
    rangeFormatter:
      options.operator?.rangeFormatter ??
      options.branch?.rangeFormatter ??
      options.base?.rangeFormatter,
  }
}

function resolveDatePreview(options: {
  base?: TableDateFilterPreviewConfig
  branch?: TableDateFilterPreviewConfig
  operator?: TableDateFilterPreviewConfig
  empty: string
  mode: 'summary' | 'tags'
}): TableDateFilterPreviewConfigResolved {
  const base = resolvePreview(options)

  return {
    ...base,
    formatter: options.operator?.formatter ?? options.branch?.formatter ?? options.base?.formatter,
    rangeFormatter:
      options.operator?.rangeFormatter ??
      options.branch?.rangeFormatter ??
      options.base?.rangeFormatter,
  }
}

function resolveOptionSelectionMode(options: {
  configured: 'auto' | 'single' | 'multiple' | undefined
  operator: TableOptionFilterOperator | undefined
}) {
  if (options.configured === 'single' || options.configured === 'multiple') return options.configured
  if (options.operator === 'isAnyOf') return 'multiple'
  return 'single'
}

function mergeNumberScalarConfig(
  base: TableNumberFilterUiScalarConfig | undefined,
  override: TableNumberFilterUiScalarConfig | undefined,
) {
  return {
    ...base,
    ...override,
    input: {
      ...base?.input,
      ...override?.input,
    },
    slider: {
      ...base?.slider,
      ...override?.slider,
    },
  }
}

function mergeNumberRangeConfig(
  base: TableNumberFilterUiRangeConfig | undefined,
  override: TableNumberFilterUiRangeConfig | undefined,
) {
  return {
    ...base,
    ...override,
    inputs: {
      ...base?.inputs,
      ...override?.inputs,
    },
    slider: {
      ...base?.slider,
      ...override?.slider,
    },
  }
}

function mergeDateScalarConfig(
  base: TableDateFilterUiScalarConfig | undefined,
  override: TableDateFilterUiScalarConfig | undefined,
) {
  return {
    ...base,
    ...override,
    input: {
      ...base?.input,
      ...override?.input,
    },
    calendar: {
      ...base?.calendar,
      ...override?.calendar,
    },
  }
}

function mergeDateRangeConfig(
  base: TableDateFilterUiRangeConfig | undefined,
  override: TableDateFilterUiRangeConfig | undefined,
) {
  return {
    ...base,
    ...override,
    input: {
      ...base?.input,
      ...override?.input,
    },
    calendar: {
      ...base?.calendar,
      ...override?.calendar,
    },
  }
}

function getNumberScalarOperatorOverride(
  definition: TableNumberFilterDefinition,
  operator: TableNumberFilterOperator | undefined,
) {
  if (
    operator === 'is' ||
    operator === 'isNot' ||
    operator === 'gt' ||
    operator === 'gte' ||
    operator === 'lt' ||
    operator === 'lte'
  ) return definition.ui?.operators?.[operator]?.scalar

  return undefined
}

function getNumberRangeOperatorOverride(
  definition: TableNumberFilterDefinition,
  operator: TableNumberFilterOperator | undefined,
) {
  if (operator === 'between') return definition.ui?.operators?.between?.range
  return undefined
}

function getDateScalarOperatorOverride(
  definition: TableDateFilterDefinition,
  operator: TableDateFilterOperator | undefined,
) {
  if (
    operator === 'is' ||
    operator === 'isNot' ||
    operator === 'before' ||
    operator === 'after'
  ) return definition.ui?.operators?.[operator]?.scalar

  return undefined
}

function getDateRangeOperatorOverride(
  definition: TableDateFilterDefinition,
  operator: TableDateFilterOperator | undefined,
) {
  if (operator === 'between') return definition.ui?.operators?.between?.range
  return undefined
}
