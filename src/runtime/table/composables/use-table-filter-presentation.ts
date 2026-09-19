import { computed, ref } from 'vue'

import { isNullish } from '../../shared/utils/predicate'
import type {
  DataListFilterPanelCommitMode,
  TableFilterOperator,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
  TableResolvedFilterPresentation,
} from '../types'
import { resolvePanelCommitRules, resolvePanelDefaultRules } from '../utils/filter-presentation'
import {
  resolveFilterDisplayLocation,
  resolveFilterDisplayOrder,
} from '../utils/filters/presentation'
import type { useTableFilters } from './use-table-filters'

export { resolvePanelCommitRules, resolvePanelDefaultRules } from '../utils/filter-presentation'

export interface UseTableFilterPresentationParams {
  filters: ReturnType<typeof useTableFilters>
}

export function useTableFilterPresentation(options: UseTableFilterPresentationParams) {
  const dynamicSessionKey = ref<string | null>(null)
  const panelOpen = ref<boolean>(false)
  const panelCommitMode = ref<DataListFilterPanelCommitMode>('submit')
  const panelDraftFilters = ref<TableQueryStateFilterRule[]>([])

  const definitions = computed(() =>
    [...options.filters.definitions.value].sort((left, right) => {
      const orderDiff = resolveFilterDisplayOrder(left) - resolveFilterDisplayOrder(right)
      if (orderDiff !== 0) {
        return orderDiff
      }
      return left.key.localeCompare(right.key)
    }),
  )

  const resolved = computed<TableResolvedFilterPresentation[]>(() =>
    definitions.value.map((definition) => {
      const active = !isNullish(options.filters.getActiveFilterState({ key: definition.key }))
      const location = resolveFilterDisplayLocation(definition.display?.location)
      const visible = location !== 'tag-dynamic' || active

      return {
        active,
        group: definition.display?.group,
        key: definition.key,
        location,
        order: resolveFilterDisplayOrder(definition),
        panelSection: definition.display?.panel?.section,
        visible,
      }
    }),
  )

  const tagDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find((item) => item.key === definition.key)
      return presentation?.location === 'tag'
    }),
  )

  const activeDynamicDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find((item) => item.key === definition.key)
      return (
        presentation?.location === 'tag-dynamic' &&
        presentation.visible &&
        dynamicSessionKey.value !== definition.key
      )
    }),
  )

  const dormantDynamicDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find((item) => item.key === definition.key)
      return (
        presentation?.location === 'tag-dynamic' &&
        !presentation.visible &&
        dynamicSessionKey.value !== definition.key
      )
    }),
  )
  const dynamicSessionDefinition = computed(() =>
    isNullish(dynamicSessionKey.value)
      ? undefined
      : definitions.value.find((definition) => definition.key === dynamicSessionKey.value),
  )

  const panelDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find((item) => item.key === definition.key)
      return presentation?.location === 'panel'
    }),
  )

  const hasPanelFilters = computed(() => panelDefinitions.value.length > 0)
  const activePanelCount = computed(
    () =>
      panelDefinitions.value.filter(
        (definition) => !isNullish(options.filters.getActiveFilterState({ key: definition.key })),
      ).length,
  )

  const panelSections = computed(() => {
    const sections = new Map<string, typeof panelDefinitions.value>()

    for (const definition of panelDefinitions.value) {
      const section = definition.display?.panel?.section ?? definition.display?.group ?? 'Filters'
      const existing = sections.get(section)

      if (existing) {
        existing.push(definition)
      } else {
        sections.set(section, [definition])
      }
    }

    return [...sections.entries()].map(([label, items]) => ({
      items,
      label,
    }))
  })

  function activateDynamicFilter(input: { key: string }) {
    dynamicSessionKey.value = input.key
  }

  function releaseDynamicSession(input: { key: string }) {
    if (dynamicSessionKey.value !== input.key) {
      return
    }
    dynamicSessionKey.value = null
  }

  function openPanel() {
    syncPanelDraft()
    panelOpen.value = true
  }

  function setPanelCommitMode(mode: DataListFilterPanelCommitMode) {
    panelCommitMode.value = mode
    syncPanelDraft()
  }

  function closePanel() {
    panelOpen.value = false
  }

  function resetPanelDraft() {
    syncPanelDraft()
  }

  function clearPanelDraft() {
    panelDraftFilters.value = resolvePanelDefaultRules({
      definitions: panelDefinitions.value,
      getDefault: (key) => options.filters.getDefaultFilterState({ key }),
    })
    if (panelCommitMode.value === 'live') {
      commitPanelDraft({ close: false })
    }
  }

  function applyPanelDraft() {
    commitPanelDraft({ close: true })
  }

  function commitPanelDraft(input: { close?: boolean } = {}) {
    options.filters.replaceFilters({
      rules: resolvePanelCommitRules({
        currentRules: options.filters.effectiveUiFilters.value,
        panelKeys: panelDefinitions.value.map((definition) => definition.key),
        panelRules: panelDraftFilters.value,
      }),
    })
    if (input.close !== false) {
      panelOpen.value = false
    }
  }

  function getPanelDraftFilterState(input: { key: string }) {
    return panelDraftFilters.value.find((rule) => rule.key === input.key)
  }

  function getPanelFilterOperator(input: { key: string }) {
    const rule = getPanelDraftFilterState(input)
    if (rule?.operator) {
      return rule.operator
    }
    return options.filters.getFilterOperator({ key: input.key })
  }

  function setPanelFilterOperator(input: { key: string; operator: TableFilterOperator }) {
    const current = getPanelDraftFilterState({ key: input.key })

    if (current) {
      upsertPanelRule({
        key: input.key,
        operator: input.operator,
        value: current.value,
      })
      return
    }

    const value = options.filters.getDefaultFilterValueForOperator({
      key: input.key,
      operator: input.operator,
    })

    upsertPanelRule({
      key: input.key,
      operator: input.operator,
      value,
    })
  }

  function setPanelScalarFilterValue(input: {
    key: string
    value: TableQueryStateFilterValue | null | undefined
    operator?: TableFilterOperator
  }) {
    if (isNullish(input.value) || input.value === '') {
      clearPanelFilter({ key: input.key })
      return
    }

    upsertPanelRule({
      key: input.key,
      operator: input.operator ?? getPanelFilterOperator({ key: input.key }),
      value: input.value,
    })
  }

  function setPanelOptionFilterValues(input: {
    key: string
    values: (string | number | boolean)[]
    operator?: TableFilterOperator
  }) {
    if (!input.values.length) {
      clearPanelFilter({ key: input.key })
      return
    }

    upsertPanelRule({
      key: input.key,
      operator: input.operator ?? getPanelFilterOperator({ key: input.key }),
      value: input.values,
    })
  }

  function clearPanelFilter(input: { key: string }) {
    const defaultRule = options.filters.getDefaultFilterState(input)
    panelDraftFilters.value = [
      ...panelDraftFilters.value.filter((rule) => rule.key !== input.key),
      ...(defaultRule ? [{ ...defaultRule }] : []),
    ]
    if (panelCommitMode.value === 'live') {
      commitPanelDraft({ close: false })
    }
  }

  function isPanelKey(key: string) {
    return panelDefinitions.value.some((definition) => definition.key === key)
  }

  function upsertPanelRule(rule: TableQueryStateFilterRule) {
    panelDraftFilters.value = [
      ...panelDraftFilters.value.filter((item) => item.key !== rule.key),
      rule,
    ]
    if (panelCommitMode.value === 'live') {
      commitPanelDraft({ close: false })
    }
  }

  function syncPanelDraft() {
    panelDraftFilters.value = options.filters.effectiveUiFilters.value
      .filter((rule) => isPanelKey(rule.key))
      .map((rule) => ({ ...rule }))
  }

  return {
    activateDynamicFilter,
    activeDynamicDefinitions,
    activePanelCount,
    applyPanelDraft,
    clearPanelDraft,
    clearPanelFilter,
    closePanel,
    commitPanelDraft,
    dormantDynamicDefinitions,
    dynamicSessionDefinition,
    getPanelDraftFilterState,
    getPanelFilterOperator,
    hasPanelFilters,
    openPanel,
    panelCommitMode,
    panelDefinitions,
    panelOpen,
    panelSections,
    releaseDynamicSession,
    resetPanelDraft,
    resolved,
    setPanelCommitMode,
    setPanelFilterOperator,
    setPanelOptionFilterValues,
    setPanelScalarFilterValue,
    tagDefinitions,
  }
}
