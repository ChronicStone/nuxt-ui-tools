<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListSortMenuUi } from '../../types'

const props = defineProps<{ label?: string; size?: DataListControlSize; ui?: DataListSortMenuUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const triggerProps = {
  type: 'button',
  'aria-haspopup': 'menu',
} as const
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.sortMenu?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListSortMenuUi>(() => ({
  ...dataListUi.ui.value.sortMenu?.ui,
  ...props.ui,
}))
const sortLabels = computed(() => {
  const labels = new Map<string, string>()
  for (const option of internals.schema.value.grid?.sortOptions ?? [])
    labels.set(option.key, typeof option.label === 'string' ? option.label : String(option.label()))
  for (const column of internals.tableColumns.runtimeColumns.value)
    if (column.sortableKey) labels.set(column.sortableKey, column.label)
  return labels
})
const activeKey = computed(() => internals.tableColumns.sortingState.value.key)
const sortKeys = computed(() => [
  ...new Set([
    ...internals.tableColumns.sortKeys.value,
    ...(internals.schema.value.grid?.sortOptions ?? []).map((option) => option.key),
  ]),
])
const activeLabel = computed(() =>
  activeKey.value ? (sortLabels.value.get(activeKey.value) ?? humanize(activeKey.value)) : null,
)
const items = computed(() => [
  sortKeys.value.map((key) => ({
    label: sortLabels.value.get(key) ?? humanize(key),
    icon: activeKey.value === key ? 'i-lucide-check' : undefined,
    onSelect: () => internals.tableColumns.setSortKey(key),
  })),
  [
    {
      label: t('table.columnsMenu.sortAsc'),
      icon: 'i-lucide-arrow-up-narrow-wide',
      onSelect: () => internals.tableColumns.setSortDirection('asc'),
    },
    {
      label: t('table.columnsMenu.sortDesc'),
      icon: 'i-lucide-arrow-down-wide-narrow',
      onSelect: () => internals.tableColumns.setSortDirection('desc'),
    },
  ],
])

function humanize(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value
  )
}
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', sideOffset: 8 }"
    :ui="{
      content: resolvedUi.content,
      group: resolvedUi.group,
      item: resolvedUi.item,
      itemLeadingIcon: resolvedUi.itemLeadingIcon,
      itemLabel: resolvedUi.itemLabel,
      itemTrailingIcon: resolvedUi.itemTrailingIcon,
    }"
  >
    <slot
      name="trigger"
      :label="activeLabel"
      :sorting="internals.tableColumns.sortingState.value"
      :set-sorting="internals.tableColumns.setSorting"
      :trigger-props="triggerProps"
    >
      <UButton
        color="neutral"
        variant="outline"
        :size="resolvedSize"
        :label="`${label ?? t('table.controls.sort')}${activeLabel ? `: ${activeLabel}` : ''}`"
        trailing-icon="i-lucide-chevron-down"
        :ui="{
          base: resolvedUi.trigger,
          label: resolvedUi.triggerLabel,
          leadingIcon: resolvedUi.triggerLeadingIcon,
          trailingIcon: resolvedUi.triggerTrailingIcon,
        }"
      />
    </slot>
  </UDropdownMenu>
</template>
