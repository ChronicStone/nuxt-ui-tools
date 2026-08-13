import type {
  TableBooleanFilterDefinition,
  TableBooleanFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableQueryStateFilterRule,
} from '../../../types'
import { resolveBooleanFilterUi, resolveOptionFilterUi } from '../ui'
import type { FilterPreviewOptionEntry, FilterPreviewResult } from './types'

export function buildOptionFilterPreview(options: {
  definition:
    | TableOptionFilterDefinition<
        object,
        object,
        string,
        string | number | boolean,
        'list' | 'tree'
      >
    | TableBooleanFilterDefinition
  rule: TableQueryStateFilterRule
  optionEntries: FilterPreviewOptionEntry[]
}): FilterPreviewResult {
  const values = Array.isArray(options.rule.value) ? options.rule.value : [options.rule.value]
  const labels = values.map((value) =>
    resolveOptionPreviewLabel({
      definition: options.definition,
      optionEntries: options.optionEntries,
      value,
    }),
  )
  const preview = resolveOptionPreview(options)
  const mode = resolvePreviewMode(preview.mode, labels.length)

  return {
    active: true,
    count: labels.length,
    tags: mode === 'tags' ? labels.slice(0, preview.maxTags) : [],
    summary: resolvePreviewSummary({
      labels,
      mode,
      maxTags: preview.maxTags,
      label: preview.label,
    }),
  }
}

function resolveOptionPreviewLabel(options: {
  definition:
    | TableOptionFilterDefinition<
        object,
        object,
        string,
        string | number | boolean,
        'list' | 'tree'
      >
    | TableBooleanFilterDefinition
  optionEntries: FilterPreviewOptionEntry[]
  value: unknown
}) {
  const matched = options.optionEntries.find(
    (entry) => String(entry.value) === String(options.value),
  )

  if (matched) {
    return matched.label
  }

  if (options.definition.kind === 'boolean') {
    const filterUi = resolveBooleanFilterUi(
      options.definition,
      options.definition.behavior?.defaultOperator ?? 'is',
    )
    return options.value ? filterUi.labels.true : filterUi.labels.false
  }

  return String(options.value ?? '')
}

function resolveOptionPreview(options: {
  definition:
    | TableOptionFilterDefinition<
        object,
        object,
        string,
        string | number | boolean,
        'list' | 'tree'
      >
    | TableBooleanFilterDefinition
  rule: TableQueryStateFilterRule
}) {
  if (options.definition.kind === 'boolean') {
    const operator: TableBooleanFilterOperator = options.rule.operator === 'isNot' ? 'isNot' : 'is'
    return resolveBooleanFilterUi(options.definition, operator).preview
  }

  const operator: TableOptionFilterOperator =
    options.rule.operator === 'isAnyOf' || options.rule.operator === 'isNot'
      ? options.rule.operator
      : 'is'

  return resolveOptionFilterUi(options.definition, operator).preview
}

function resolvePreviewMode(mode: string, count: number) {
  if (mode === 'summary' || mode === 'tags') return mode
  return count > 1 ? 'tags' : 'summary'
}

function resolvePreviewSummary(options: {
  labels: string[]
  mode: 'summary' | 'tags'
  maxTags: number
  label: string
}) {
  if (options.mode === 'summary') {
    const summary = options.labels.join(', ')
    return options.label && summary ? `${options.label}: ${summary}` : summary
  }

  const overflow = options.labels.length - options.maxTags
  if (overflow <= 0) return ''
  return `+${overflow}`
}
