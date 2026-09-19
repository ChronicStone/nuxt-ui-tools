<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { ref, computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isString } from '../../../shared/utils/predicate'
import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListButtonProps,
  DataListControlSize,
  DataListSortMenuProps,
  DataListSortMenuUi,
  TableLayout,
} from '../../types'
import {
  mergeDataListProps,
  mergeDataListUiClass,
  resolveDataListPopoverContentClass,
} from '../../utils'
import SortMenuPanel from './sort-menu-panel.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    size?: DataListControlSize
    layouts?: TableLayout[]
    ui?: DataListSortMenuUi
    props?: DataListSortMenuProps
  }>(),
  { layouts: () => ['grid'] },
)
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { isMobile } = useDataListBreakpoint()
const { t } = useUiToolsLocale()
const sheetOpen = ref<boolean>(false)
const menuOpen = ref<boolean>(false)
const triggerProps = {
  'aria-haspopup': 'dialog',
  type: 'button',
} as const
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.sortMenu?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListSortMenuUi>(() => ({
  ...dataListUi.ui.value.sortMenu?.ui,
  ...props.ui,
}))
const visible = computed(() => props.layouts.includes(internals.controls.tableLayout.value))
const triggerControlProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', size: resolvedSize.value, variant: 'outline' },
    dataListUi.ui.value.sortMenu?.props?.trigger,
    props.props?.trigger,
  ),
)
const sheetTriggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    {
      color: 'neutral',
      icon: 'i-lucide-arrow-down-up',
      size: resolvedSize.value,
      square: true,
      variant: 'outline',
    },
    dataListUi.ui.value.sortMenu?.props?.sheetTrigger,
    props.props?.sheetTrigger,
  ),
)
const sortLabels = computed(() => {
  const labels = new Map<string, string>()
  for (const option of internals.schema.value.grid?.sortOptions ?? []) {
    labels.set(option.key, isString(option.label) ? option.label : String(option.label()))
  }
  for (const column of internals.tableColumns.runtimeColumns.value) {
    if (column.sortableKey) {
      labels.set(column.sortableKey, column.label)
    }
  }
  return labels
})
const activeKey = computed(() => internals.tableColumns.sortingState.value.key)
const activeDirection = computed(() => internals.tableColumns.sortingState.value.dir)
const directionIcon = computed(() =>
  activeDirection.value === 'asc'
    ? 'i-lucide-arrow-up-narrow-wide'
    : 'i-lucide-arrow-down-wide-narrow',
)
const gridSortKeys = computed(() =>
  (internals.schema.value.grid?.sortOptions ?? []).map((option) => option.key),
)
const sortKeys = computed(() =>
  internals.controls.tableLayout.value === 'grid' && gridSortKeys.value.length
    ? gridSortKeys.value
    : [...new Set([...internals.tableColumns.sortKeys.value, ...gridSortKeys.value])],
)
const activeLabel = computed(() =>
  activeKey.value ? (sortLabels.value.get(activeKey.value) ?? humanize(activeKey.value)) : null,
)

function humanize(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replaceAll(/[_-]+/gu, ' ')
      .replaceAll(/\b\w/gu, (char) => char.toUpperCase()) ?? value
  )
}
</script>

<template>
  <UDrawer
    v-if="visible && isMobile"
    v-model:open="sheetOpen"
    direction="bottom"
    :title="label ?? t('table.controls.sort')"
    :ui="{
      header: 'sr-only',
      content: 'nut-dl-sheet max-h-[85vh] rounded-t-[16px]',
      container: 'gap-0 p-0',
      body: 'min-h-0 overflow-y-auto p-0 pb-2',
    }"
  >
    <UButton
      v-bind="sheetTriggerProps"
      :aria-label="label ?? t('table.controls.sort')"
      :ui="{
        base: mergeDataListUiClass(
          'nut-dl-sortbtn nut-dl-sortbtn--sheet',
          undefined,
          resolvedUi.trigger,
        ),
      }"
    />
    <template #body>
      <SortMenuPanel
        :keys="sortKeys"
        :labels="sortLabels"
        :active-key="activeKey"
        :active-direction="activeDirection"
        @select-key="internals.tableColumns.setSortKey($event)"
        @select-direction="internals.tableColumns.setSortDirection($event)"
      />
    </template>
  </UDrawer>

  <UPopover
    v-else-if="visible"
    v-model:open="menuOpen"
    mode="click"
    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
    :ui="{
      content: resolveDataListPopoverContentClass(
        'fit',
        mergeDataListUiClass(
          'nut-dl-sortpanel w-56 overflow-hidden p-0',
          undefined,
          resolvedUi.content,
        ),
      ),
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
        v-bind="triggerControlProps"
        icon="i-lucide-arrow-down-up"
        :ui="{
          base: mergeDataListUiClass('nut-dl-sortbtn', undefined, resolvedUi.trigger),
          label: resolvedUi.triggerLabel,
          leadingIcon: resolvedUi.triggerLeadingIcon,
          trailingIcon: resolvedUi.triggerTrailingIcon,
        }"
      >
        <span class="nut-dl-sortbtn__label flex items-center gap-1.5">
          <span>{{ label ?? t('table.controls.sort') }}</span>
          <span v-if="activeLabel" class="font-semibold text-highlighted">{{ activeLabel }}</span>
          <UIcon
            v-if="activeLabel"
            :name="activeDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
            class="size-3.5 text-primary"
          />
        </span>
      </UButton>
    </slot>

    <template #content>
      <SortMenuPanel
        compact
        :keys="sortKeys"
        :labels="sortLabels"
        :active-key="activeKey"
        :active-direction="activeDirection"
        @select-key="internals.tableColumns.setSortKey($event)"
        @select-direction="internals.tableColumns.setSortDirection($event)"
      />
    </template>
  </UPopover>
</template>
