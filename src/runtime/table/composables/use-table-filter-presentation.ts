import { computed, ref } from 'vue'

import type {
  TableFilterOperator,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
  TableResolvedFilterPresentation,
} from '../types'
import { resolveFilterDisplayLocation, resolveFilterDisplayOrder } from '../utils'
import type { useTableFilters } from './use-table-filters'

export interface UseTableFilterPresentationParams {
  filters: ReturnType<typeof useTableFilters>
}

export function useTableFilterPresentation(options: UseTableFilterPresentationParams) {
  const dynamicOpenKeys = ref<Set<string>>(new Set())
  const dynamicActivationToken = ref<Record<string, number>>({})
  const panelOpen = ref<boolean>(false)
  const panelDraftFilters = ref<TableQueryStateFilterRule[]>([])

  const definitions = computed(() =>
    [...options.filters.definitions.value].sort((left, right) => {
      const orderDiff = resolveFilterDisplayOrder(left) - resolveFilterDisplayOrder(right)
      if (orderDiff !== 0) return orderDiff
      return left.key.localeCompare(right.key)
    }),
  )

  const resolved = computed<TableResolvedFilterPresentation[]>(() =>
    definitions.value.map((definition) => {
      const active = options.filters.getFilterState({ key: definition.key }) != null
      const location = resolveFilterDisplayLocation(definition.display?.location)
      const visible = location !== 'tag-dynamic' || active || dynamicOpenKeys.value.has(definition.key)

      return {
        key: definition.key,
        location,
        order: resolveFilterDisplayOrder(definition),
        group: definition.display?.group,
        panelSection: definition.display?.panel?.section,
        active,
        visible,
      }
    }),
  )

  const tagDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find(item => item.key === definition.key)
      return presentation?.location === 'tag'
    }),
  )

  const activeDynamicDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find(item => item.key === definition.key)
      return presentation?.location === 'tag-dynamic' && presentation.visible
    }),
  )

  const dormantDynamicDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find(item => item.key === definition.key)
      return presentation?.location === 'tag-dynamic' && !presentation.visible
    }),
  )

  const panelDefinitions = computed(() =>
    definitions.value.filter((definition) => {
      const presentation = resolved.value.find(item => item.key === definition.key)
      return presentation?.location === 'panel'
    }),
  )

  const hasPanelFilters = computed(() => panelDefinitions.value.length > 0)
  const activePanelCount = computed(() =>
    panelDefinitions.value.filter(definition => options.filters.getFilterState({ key: definition.key }) != null).length,
  )

  const panelSections = computed(() => {
    const sections = new Map<string, typeof panelDefinitions.value>()

    for (const definition of panelDefinitions.value) {
      const section = definition.display?.panel?.section ?? definition.display?.group ?? 'Filters'
      const existing = sections.get(section)

      if (existing) existing.push(definition)
      else sections.set(section, [definition])
    }

    return [...sections.entries()].map(([label, items]) => ({
      label,
      items,
    }))
  })

  function activateDynamicFilter(input: { key: string }) {
    dynamicOpenKeys.value = new Set([...dynamicOpenKeys.value, input.key])
    dynamicActivationToken.value = {
      ...dynamicActivationToken.value,
      [input.key]: (dynamicActivationToken.value[input.key] ?? 0) + 1,
    }
  }

  function dismissDynamicFilter(input: { key: string }) {
    if (options.filters.getFilterState({ key: input.key }) != null) return

    const nextKeys = new Set(dynamicOpenKeys.value)
    nextKeys.delete(input.key)
    dynamicOpenKeys.value = nextKeys
  }

  function openPanel() {
    panelDraftFilters.value = options.filters.activeUiFilters.value
      .filter((rule) => isPanelKey(rule.key))
      .map(rule => ({ ...rule }))
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  function resetPanelDraft() {
    panelDraftFilters.value = options.filters.activeUiFilters.value
      .filter((rule) => isPanelKey(rule.key))
      .map(rule => ({ ...rule }))
  }

  function clearPanelDraft() {
    panelDraftFilters.value = []
    const preservedRules = options.filters.activeUiFilters.value.filter(rule => !isPanelKey(rule.key))
    options.filters.replaceFilters({
      rules: preservedRules,
    })
  }

  function applyPanelDraft() {
    const nextPanelRules = panelDraftFilters.value.map(rule => ({ ...rule }))
    const preservedRules = options.filters.activeUiFilters.value.filter(rule => !isPanelKey(rule.key))
    options.filters.replaceFilters({
      rules: [...preservedRules, ...nextPanelRules],
    })
    panelOpen.value = false
  }

  function getPanelDraftFilterState(input: { key: string }) {
    return panelDraftFilters.value.find(rule => rule.key === input.key)
  }

  function getPanelFilterOperator(input: { key: string }) {
    const rule = getPanelDraftFilterState(input)
    if (rule?.operator) return rule.operator
    return options.filters.getFilterOperator({ key: input.key })
  }

  function setPanelFilterOperator(input: { key: string; operator: TableFilterOperator }) {
    const current = getPanelDraftFilterState({ key: input.key })

    if (current) {
      upsertPanelRule({
        key: input.key,
        value: current.value,
        operator: input.operator,
      })
      return
    }

    const value = options.filters.getDefaultFilterValueForOperator({
      key: input.key,
      operator: input.operator,
    })

    upsertPanelRule({
      key: input.key,
      value,
      operator: input.operator,
    })
  }

  function setPanelScalarFilterValue(input: {
    key: string
    value: TableQueryStateFilterValue | null | undefined
    operator?: TableFilterOperator
  }) {
    if (input.value == null || input.value === '') {
      clearPanelFilter({ key: input.key })
      return
    }

    upsertPanelRule({
      key: input.key,
      value: input.value,
      operator: input.operator ?? getPanelFilterOperator({ key: input.key }),
    })
  }

  function setPanelOptionFilterValues(input: {
    key: string
    values: Array<string | number | boolean>
    operator?: TableFilterOperator
  }) {
    if (!input.values.length) {
      clearPanelFilter({ key: input.key })
      return
    }

    upsertPanelRule({
      key: input.key,
      value: input.values,
      operator: input.operator ?? getPanelFilterOperator({ key: input.key }),
    })
  }

  function clearPanelFilter(input: { key: string }) {
    panelDraftFilters.value = panelDraftFilters.value.filter(rule => rule.key !== input.key)
  }

  function getDynamicActivationToken(input: { key: string }) {
    return dynamicActivationToken.value[input.key] ?? 0
  }

  function isPanelKey(key: string) {
    return panelDefinitions.value.some(definition => definition.key === key)
  }

  function upsertPanelRule(rule: TableQueryStateFilterRule) {
    panelDraftFilters.value = [
      ...panelDraftFilters.value.filter(item => item.key !== rule.key),
      rule,
    ]
  }

  return {
    resolved,
    tagDefinitions,
    activeDynamicDefinitions,
    dormantDynamicDefinitions,
    panelDefinitions,
    panelSections,
    hasPanelFilters,
    activePanelCount,
    panelOpen,
    activateDynamicFilter,
    dismissDynamicFilter,
    getDynamicActivationToken,
    openPanel,
    closePanel,
    resetPanelDraft,
    clearPanelDraft,
    applyPanelDraft,
    getPanelDraftFilterState,
    getPanelFilterOperator,
    setPanelFilterOperator,
    setPanelScalarFilterValue,
    setPanelOptionFilterValues,
    clearPanelFilter,
  }
}
