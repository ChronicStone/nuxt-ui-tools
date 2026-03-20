import type {
  GenericObject,
  TableBooleanFilterDefinition,
  TableBooleanFilterEditorConfig,
  TableBooleanFilterOperator,
  TableBooleanFilterUiResolved,
  TableDateFilterDefinition,
  TableDateFilterEditorConfig,
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
  TableNumberFilterDefinition,
  TableNumberFilterEditorConfig,
  TableNumberFilterOperator,
  TableNumberFilterPreviewConfig,
  TableNumberFilterPreviewConfigResolved,
  TableNumberFilterUiRangeConfig,
  TableNumberFilterUiResolved,
  TableNumberFilterUiScalarConfig,
  TableOptionFilterDefinition,
  TableOptionFilterEditorConfig,
  TableOptionFilterOperator,
  TableOptionFilterUiResolved,
  TableTagFilterPreviewConfig,
  TableTagFilterPreviewConfigResolved,
  TableTextFilterDefinition,
  TableTextFilterOperator,
  TableTextFilterUiResolved,
  TableTextValue,
} from '../../types'
import { getFilterLabelText, getFilterTextValue } from './common'

export function resolveTextFilterUi(
  definition: TableTextFilterDefinition,
  operator: TableTextFilterOperator | undefined,
): TableTextFilterUiResolved {
  const override = operator ? definition.editor?.operators?.[operator] : undefined

  return {
    commitMode: definition.behavior?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    actions: resolveActions({ common: definition.actions }),
    placeholder: getFilterTextValue({
      value: override?.placeholder ?? definition.editor?.placeholder,
      fallback: getFilterLabelText({ label: definition.label }),
    }),
    inputType: definition.editor?.inputType ?? 'text',
    leadingIcon: definition.editor?.leadingIcon ?? 'i-lucide-search',
    autocomplete: definition.editor?.autocomplete ?? 'off',
    input: {
      autofocus: definition.editor?.input?.autofocus ?? false,
      highlight: definition.editor?.input?.highlight ?? false,
      fixed: definition.editor?.input?.fixed ?? false,
    },
    preview: resolvePreview({
      base: definition.preview,
      empty: 'Select…',
      mode: 'summary',
    }),
  }
}

export function resolveOptionFilterUi(
  definition: TableOptionFilterDefinition<GenericObject, GenericObject, string>,
  operator: TableOptionFilterOperator | undefined,
): TableOptionFilterUiResolved {
  const override = operator ? definition.editor?.operators?.[operator] : undefined
  const selection = {
    ...definition.editor?.selection,
    ...override?.selection,
  }
  const tree = definition.editor?.presentation === 'tree' ? definition.editor.tree : undefined
  const row = {
    ...definition.editor?.row,
    ...override?.row,
  }
  const labels = {
    ...definition.editor?.labels,
    ...override?.labels,
  }
  const mode = resolveOptionSelectionMode({
    configured: selection.mode,
    operator,
  })

  return {
    commitMode: definition.behavior?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    actions: resolveActions({
      common: definition.actions,
      local: labels,
    }),
    searchable: definition.editor?.searchable ?? true,
    closeOnSelect: definition.editor?.closeOnSelect ?? false,
    presentation: definition.editor?.presentation ?? 'list',
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
      base: definition.preview,
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
  const override = operator ? definition.editor?.operators?.[operator] : undefined
  const labels = {
    ...definition.editor?.labels,
    ...override?.labels,
  }
  const icons = {
    ...definition.editor?.icons,
    ...override?.icons,
  }
  const selection = {
    ...definition.editor?.selection,
    ...override?.selection,
  }

  return {
    commitMode: definition.behavior?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    actions: resolveActions({
      common: definition.actions,
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
      base: definition.preview,
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
  const scalarOverride = getNumberScalarOperatorOverride(definition.editor, operator)
  const rangeOverride = getNumberRangeOperatorOverride(definition.editor, operator)
  const scalar = mergeNumberScalarConfig(definition.editor?.scalar, scalarOverride)
  const range = mergeNumberRangeConfig(definition.editor?.range, rangeOverride)

  return {
    commitMode: definition.behavior?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    actions: resolveActions({ common: definition.actions }),
    min: definition.editor?.min,
    max: definition.editor?.max,
    step: definition.editor?.step ?? 1,
    formatOptions: definition.editor?.formatOptions,
    preview: resolveNumberPreview({
      base: definition.preview,
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
        min: scalar.slider?.min ?? definition.editor?.min,
        max: scalar.slider?.max ?? definition.editor?.max,
        step: scalar.slider?.step ?? definition.editor?.step,
        showTooltip: scalar.slider?.showTooltip ?? true,
      },
      preview: resolveNumberPreview({
        base: definition.preview,
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
        min: range.slider?.min ?? definition.editor?.min,
        max: range.slider?.max ?? definition.editor?.max,
        step: range.slider?.step ?? definition.editor?.step,
        showTooltip: range.slider?.showTooltip ?? true,
      },
      preview: resolveNumberPreview({
        base: definition.preview,
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
  const scalarOverride = getDateScalarOperatorOverride(definition.editor, operator)
  const rangeOverride = getDateRangeOperatorOverride(definition.editor, operator)
  const scalar = mergeDateScalarConfig(definition.editor?.scalar, scalarOverride)
  const range = mergeDateRangeConfig(definition.editor?.range, rangeOverride)

  return {
    commitMode: definition.behavior?.commitMode ?? 'manual',
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    actions: resolveActions({ common: definition.actions }),
    preview: resolveDatePreview({
      base: definition.preview,
      empty: 'Select…',
      mode: 'summary',
    }),
    scalar: {
      display: scalar.display ?? 'calendar',
      presets: scalar.presets,
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
        base: definition.preview,
        empty: 'Select…',
        mode: 'summary',
      }),
    },
    range: {
      display: range.display ?? 'inputs-calendar',
      presets: range.presets,
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
        months: range.calendar?.months,
        pagedNavigation: range.calendar?.pagedNavigation,
        fixedWeeks: range.calendar?.fixedWeeks ?? true,
        min: range.calendar?.min,
        max: range.calendar?.max,
        maxRangeDays: range.calendar?.maxRangeDays,
      },
      preview: resolveDatePreview({
        base: definition.preview,
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
  empty: string
  mode: 'summary' | 'tags'
}): TableFilterPreviewConfigResolved {
  return {
    mode: options.base?.mode ?? options.mode,
    label: getFilterTextValue({
      value: options.base?.label,
    }),
    empty: getFilterTextValue({
      value: options.base?.empty,
      fallback: options.empty,
    }),
  }
}

function resolveTagPreview(options: {
  base?: TableTagFilterPreviewConfig
  empty: string
  mode: TableFilterPreviewMode
  maxTags: number
}): TableTagFilterPreviewConfigResolved {
  return {
    mode: options.base?.mode ?? options.mode,
    label: getFilterTextValue({
      value: options.base?.label,
    }),
    empty: getFilterTextValue({
      value: options.base?.empty,
      fallback: options.empty,
    }),
    maxTags: options.base?.maxTags ?? options.maxTags,
  }
}

function resolveNumberPreview(options: {
  base?: TableNumberFilterPreviewConfig
  empty: string
  mode: 'summary' | 'tags'
}): TableNumberFilterPreviewConfigResolved {
  const base = resolvePreview(options)

  return {
    ...base,
    formatter: options.base?.formatter,
    rangeFormatter: options.base?.rangeFormatter,
  }
}

function resolveDatePreview(options: {
  base?: TableDateFilterPreviewConfig
  empty: string
  mode: 'summary' | 'tags'
}): TableDateFilterPreviewConfigResolved {
  const base = resolvePreview(options)

  return {
    ...base,
    formatter: options.base?.formatter,
    rangeFormatter: options.base?.rangeFormatter,
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
  editor: TableNumberFilterEditorConfig | undefined,
  operator: TableNumberFilterOperator | undefined,
) {
  if (
    operator === 'is' ||
    operator === 'isNot' ||
    operator === 'gt' ||
    operator === 'gte' ||
    operator === 'lt' ||
    operator === 'lte'
  ) return editor?.operators?.[operator]?.scalar

  return undefined
}

function getNumberRangeOperatorOverride(
  editor: TableNumberFilterEditorConfig | undefined,
  operator: TableNumberFilterOperator | undefined,
) {
  if (operator === 'between') return editor?.operators?.between?.range
  return undefined
}

function getDateScalarOperatorOverride(
  editor: TableDateFilterEditorConfig | undefined,
  operator: TableDateFilterOperator | undefined,
) {
  if (
    operator === 'is' ||
    operator === 'isNot' ||
    operator === 'before' ||
    operator === 'after'
  ) return editor?.operators?.[operator]?.scalar

  return undefined
}

function getDateRangeOperatorOverride(
  editor: TableDateFilterEditorConfig | undefined,
  operator: TableDateFilterOperator | undefined,
) {
  if (operator === 'between') return editor?.operators?.between?.range
  return undefined
}
