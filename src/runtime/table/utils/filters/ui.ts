import { useUiToolsLocale } from '#ui-tools/i18n'

import type {
  GenericObject,
  TableBooleanFilterDefinition,
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
  TableOptionFilterOperator,
  TableOptionFilterUiResolved,
  TableTagFilterPreviewConfig,
  TableTagFilterPreviewConfigResolved,
  TableTextFilterDefinition,
  TableTextFilterOperator,
  TableTextFilterUiResolved,
  TableTextValue,
  TableUiFilterDefinition,
} from '../../types'
import { getFilterLabelText, getFilterTextValue } from './common'

const DEFAULT_FILTER_TRIGGER_ICONS = {
  boolean: 'i-lucide-check',
  date: 'i-lucide-calendar-days',
  number: 'i-lucide-hash',
  option: 'i-lucide-filter',
  text: 'i-lucide-search',
} as const

export function resolveFilterTriggerIcon(
  definition: TableUiFilterDefinition<GenericObject, GenericObject, string>,
) {
  return definition.display?.icon ?? DEFAULT_FILTER_TRIGGER_ICONS[definition.kind]
}

export function resolveTextFilterUi(
  definition: TableTextFilterDefinition,
  operator: TableTextFilterOperator | undefined,
): TableTextFilterUiResolved {
  const { t } = useUiToolsLocale()
  const override = operator ? definition.editor?.operators?.[operator] : undefined

  return {
    actions: resolveActions({ common: definition.actions }),
    autocomplete: definition.editor?.autocomplete ?? 'off',
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    commitMode: definition.behavior?.commitMode ?? 'auto',
    input: {
      autofocus: definition.editor?.input?.autofocus ?? false,
      fixed: definition.editor?.input?.fixed ?? false,
      highlight: definition.editor?.input?.highlight ?? false,
    },
    inputType: definition.editor?.inputType ?? 'text',
    leadingIcon: definition.editor?.leadingIcon ?? 'i-lucide-search',
    placeholder: getFilterTextValue({
      fallback: getFilterLabelText({ label: definition.label }),
      value: override?.placeholder ?? definition.editor?.placeholder,
    }),
    preview: resolvePreview({
      base: definition.preview,
      empty: t('table.filters.preview.empty'),
      mode: 'summary',
    }),
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
  }
}

export function resolveOptionFilterUi(
  definition: TableOptionFilterDefinition<GenericObject, GenericObject, string>,
  operator: TableOptionFilterOperator | undefined,
): TableOptionFilterUiResolved {
  const { t } = useUiToolsLocale()
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
    actions: resolveActions({
      common: definition.actions,
      local: labels,
    }),
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    closeOnSelect: definition.editor?.closeOnSelect ?? false,
    commitMode: definition.behavior?.commitMode ?? 'auto',
    labels: {
      empty: getFilterTextValue({
        fallback: t('table.filters.options.empty'),
        value: labels.empty,
      }),
      searchPlaceholder: getFilterTextValue({
        fallback: getFilterLabelText({ label: definition.label }),
        value: labels.searchPlaceholder,
      }),
    },
    presentation: definition.editor?.presentation ?? 'list',
    preview: resolveTagPreview({
      base: definition.preview,
      empty: t('table.filters.preview.empty'),
      maxTags: 3,
      mode: 'auto',
    }),
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    row: {
      getIcon: row.getIcon,
      selectedIcon: row.selectedIcon ?? 'i-lucide-check',
      showCounts: row.showCounts ?? true,
      truncate: row.truncate ?? true,
    },
    searchable: definition.editor?.searchable ?? true,
    selection: {
      allowEmpty: selection.allowEmpty ?? true,
      max: selection.max,
      mode,
    },
    tree: {
      branchSelection: tree?.branchSelection ?? 'children',
      expandedByDefault: tree?.expandedByDefault ?? false,
      searchMode: tree?.searchMode ?? 'auto',
      selectable: tree?.selectable ?? 'all',
    },
  }
}

export function resolveBooleanFilterUi(
  definition: TableBooleanFilterDefinition,
  operator: TableBooleanFilterOperator | undefined,
): TableBooleanFilterUiResolved {
  const { t } = useUiToolsLocale()
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
    actions: resolveActions({
      common: definition.actions,
      local: labels,
    }),
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    commitMode: definition.behavior?.commitMode ?? 'auto',
    icons: {
      false: icons.false,
      true: icons.true,
    },
    labels: {
      empty: getFilterTextValue({
        fallback: t('table.filters.booleans.empty'),
        value: labels.empty,
      }),
      false: getFilterTextValue({
        fallback: t('table.filters.booleans.false'),
        value: labels.false,
      }),
      true: getFilterTextValue({
        fallback: t('table.filters.booleans.true'),
        value: labels.true,
      }),
    },
    preview: resolveTagPreview({
      base: definition.preview,
      empty: getFilterTextValue({
        fallback: t('table.filters.booleans.empty'),
        value: labels.empty,
      }),
      maxTags: 3,
      mode: 'summary',
    }),
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    selection: {
      allowEmpty: selection.allowEmpty ?? true,
    },
  }
}

export function resolveNumberFilterUi(
  definition: TableNumberFilterDefinition,
  operator: TableNumberFilterOperator | undefined,
): TableNumberFilterUiResolved {
  const { t } = useUiToolsLocale()
  const scalarOverride = getNumberScalarOperatorOverride(definition.editor, operator)
  const rangeOverride = getNumberRangeOperatorOverride(definition.editor, operator)
  const scalar = mergeNumberScalarConfig(definition.editor?.scalar, scalarOverride)
  const range = mergeNumberRangeConfig(definition.editor?.range, rangeOverride)

  return {
    actions: resolveActions({ common: definition.actions }),
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    commitMode: definition.behavior?.commitMode ?? 'auto',
    formatOptions: definition.editor?.formatOptions,
    max: definition.editor?.max,
    min: definition.editor?.min,
    preview: resolveNumberPreview({
      base: definition.preview,
      empty: t('table.filters.preview.empty'),
      mode: 'summary',
    }),
    range: {
      display: range.display ?? 'inputs',
      inputs: {
        disableWheelChange: range.inputs?.disableWheelChange ?? true,
        fromPlaceholder: getFilterTextValue({
          fallback: 'Min',
          value: range.inputs?.fromPlaceholder,
        }),
        hideStepper: range.inputs?.hideStepper ?? false,
        toPlaceholder: getFilterTextValue({
          fallback: 'Max',
          value: range.inputs?.toPlaceholder,
        }),
      },
      minGap: range.minGap,
      preview: resolveNumberPreview({
        base: definition.preview,
        empty: t('table.filters.preview.empty'),
        mode: 'summary',
      }),
      slider: {
        max: range.slider?.max ?? definition.editor?.max,
        min: range.slider?.min ?? definition.editor?.min,
        showTooltip: range.slider?.showTooltip ?? true,
        step: range.slider?.step ?? definition.editor?.step,
      },
    },
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    scalar: {
      display: scalar.display ?? 'input',
      input: {
        disableWheelChange: scalar.input?.disableWheelChange ?? true,
        hideStepper: scalar.input?.hideStepper ?? false,
        placeholder: getFilterTextValue({
          fallback: getFilterLabelText({ label: definition.label }),
          value: scalar.input?.placeholder,
        }),
      },
      preview: resolveNumberPreview({
        base: definition.preview,
        empty: t('table.filters.preview.empty'),
        mode: 'summary',
      }),
      slider: {
        max: scalar.slider?.max ?? definition.editor?.max,
        min: scalar.slider?.min ?? definition.editor?.min,
        showTooltip: scalar.slider?.showTooltip ?? true,
        step: scalar.slider?.step ?? definition.editor?.step,
      },
    },
    step: definition.editor?.step ?? 1,
  }
}

export function resolveDateFilterUi(
  definition: TableDateFilterDefinition,
  operator: TableDateFilterOperator | undefined,
): TableDateFilterUiResolved {
  const { t } = useUiToolsLocale()
  const scalarOverride = getDateScalarOperatorOverride(definition.editor, operator)
  const rangeOverride = getDateRangeOperatorOverride(definition.editor, operator)
  const scalar = mergeDateScalarConfig(definition.editor?.scalar, scalarOverride)
  const range = mergeDateRangeConfig(definition.editor?.range, rangeOverride)

  return {
    actions: resolveActions({ common: definition.actions }),
    clearOnOperatorChange: definition.behavior?.clearOnOperatorChange ?? true,
    commitMode: definition.behavior?.commitMode ?? 'auto',
    preview: resolveDatePreview({
      base: definition.preview,
      empty: t('table.filters.preview.empty'),
      mode: 'summary',
    }),
    range: {
      calendar: {
        fixedWeeks: range.calendar?.fixedWeeks ?? true,
        max: range.calendar?.max,
        maxRangeDays: range.calendar?.maxRangeDays,
        min: range.calendar?.min,
        months: range.calendar?.months,
        pagedNavigation: range.calendar?.pagedNavigation,
      },
      display: range.display ?? 'inputs-calendar',
      input: {
        fixed: range.input?.fixed ?? true,
        fromPlaceholder: getFilterTextValue({
          fallback: 'Start date',
          value: range.input?.fromPlaceholder,
        }),
        granularity: range.input?.granularity ?? 'day',
        hideTimeZone: range.input?.hideTimeZone ?? true,
        highlight: range.input?.highlight ?? false,
        hourCycle: range.input?.hourCycle,
        toPlaceholder: getFilterTextValue({
          fallback: 'End date',
          value: range.input?.toPlaceholder,
        }),
      },
      presets: range.presets,
      presetsPlacement: range.presetsPlacement ?? 'side',
      preview: resolveDatePreview({
        base: definition.preview,
        empty: t('table.filters.preview.empty'),
        mode: 'summary',
      }),
    },
    reopenOnOperatorChange: definition.behavior?.reopenOnOperatorChange ?? true,
    scalar: {
      calendar: {
        fixedWeeks: scalar.calendar?.fixedWeeks ?? true,
        max: scalar.calendar?.max,
        maxRangeDays: scalar.calendar?.maxRangeDays,
        min: scalar.calendar?.min,
        months: scalar.calendar?.months,
        pagedNavigation: scalar.calendar?.pagedNavigation,
      },
      display: scalar.display ?? 'calendar',
      input: {
        fixed: scalar.input?.fixed ?? true,
        granularity: scalar.input?.granularity ?? 'day',
        hideTimeZone: scalar.input?.hideTimeZone ?? true,
        highlight: scalar.input?.highlight ?? false,
        hourCycle: scalar.input?.hourCycle,
        placeholder: getFilterTextValue({
          fallback: getFilterLabelText({ label: definition.label }),
          value: scalar.input?.placeholder,
        }),
      },
      presets: scalar.presets,
      preview: resolveDatePreview({
        base: definition.preview,
        empty: t('table.filters.preview.empty'),
        mode: 'summary',
      }),
    },
  }
}

function resolveActions(options: {
  common?: { clear?: TableTextValue; apply?: TableTextValue }
  local?: { clear?: TableTextValue; apply?: TableTextValue }
}): TableFilterUiActionLabelsResolved {
  const { t } = useUiToolsLocale()

  return {
    apply: getFilterTextValue({
      fallback: t('table.filters.panel.apply'),
      value: options.local?.apply ?? options.common?.apply,
    }),
    clear: getFilterTextValue({
      fallback: t('table.filters.panel.clearAll'),
      value: options.local?.clear ?? options.common?.clear,
    }),
  }
}

function resolvePreview(options: {
  base?: TableFilterPreviewConfig
  empty: string
  mode: 'summary' | 'tags'
}): TableFilterPreviewConfigResolved {
  return {
    empty: getFilterTextValue({
      fallback: options.empty,
      value: options.base?.empty,
    }),
    label: getFilterTextValue({
      value: options.base?.label,
    }),
    mode: options.base?.mode ?? options.mode,
  }
}

function resolveTagPreview(options: {
  base?: TableTagFilterPreviewConfig
  empty: string
  mode: TableFilterPreviewMode
  maxTags: number
}): TableTagFilterPreviewConfigResolved {
  return {
    empty: getFilterTextValue({
      fallback: options.empty,
      value: options.base?.empty,
    }),
    label: getFilterTextValue({
      value: options.base?.label,
    }),
    maxTags: options.base?.maxTags ?? options.maxTags,
    mode: options.base?.mode ?? options.mode,
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
  if (options.configured === 'single' || options.configured === 'multiple') {
    return options.configured
  }
  if (options.operator === 'isAnyOf') {
    return 'multiple'
  }
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
    calendar: {
      ...base?.calendar,
      ...override?.calendar,
    },
    input: {
      ...base?.input,
      ...override?.input,
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
    calendar: {
      ...base?.calendar,
      ...override?.calendar,
    },
    input: {
      ...base?.input,
      ...override?.input,
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
  ) {
    return editor?.operators?.[operator]?.scalar
  }
}

function getNumberRangeOperatorOverride(
  editor: TableNumberFilterEditorConfig | undefined,
  operator: TableNumberFilterOperator | undefined,
) {
  if (operator === 'between') {
    return editor?.operators?.between?.range
  }
}

function getDateScalarOperatorOverride(
  editor: TableDateFilterEditorConfig | undefined,
  operator: TableDateFilterOperator | undefined,
) {
  if (operator === 'is' || operator === 'isNot' || operator === 'before' || operator === 'after') {
    return editor?.operators?.[operator]?.scalar
  }
}

function getDateRangeOperatorOverride(
  editor: TableDateFilterEditorConfig | undefined,
  operator: TableDateFilterOperator | undefined,
) {
  if (operator === 'between') {
    return editor?.operators?.between?.range
  }
}
