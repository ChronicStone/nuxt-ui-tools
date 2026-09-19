<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
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
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'

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
const triggerProps = {
  'aria-haspopup': 'menu',
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
    if (column.sortableKey) labels.set(column.sortableKey, column.label)
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
const items = computed(() => [
  sortKeys.value.map((key) => ({
    icon: activeKey.value === key ? 'i-lucide-check' : undefined,
    label: sortLabels.value.get(key) ?? humanize(key),
    onSelect: () => internals.tableColumns.setSortKey(key),
  })),
  [
    {
      icon: 'i-lucide-arrow-up-narrow-wide',
      label: t('table.columnsMenu.sortAsc'),
      onSelect: () => internals.tableColumns.setSortDirection('asc'),
    },
    {
      icon: 'i-lucide-arrow-down-wide-narrow',
      label: t('table.columnsMenu.sortDesc'),
      onSelect: () => internals.tableColumns.setSortDirection('desc'),
    },
  ],
])

function humanize(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replaceAll(/[_-]+/g, ' ')
      .replaceAll(/\b\w/g, (char) => char.toUpperCase()) ?? value
  )
}
</script>

<template>
  <UDrawer
    v-if="visible && isMobile"
    v-model:open="sheetOpen"
    direction="bottom"
    :ui="{
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
      <div
        class="nut-dl-sheet__title px-5 pt-3 pb-2 text-[11px] font-semibold tracking-[0.06em] text-dimmed uppercase"
      >
        {{ t('table.filters.sheet.sortBy') }}
      </div>
      <div class="px-[10px]">
        <button
          v-for="key in sortKeys"
          :key="key"
          type="button"
          class="nut-dl-sheet__row flex h-[46px] w-full items-center gap-[10px] rounded-lg px-[10px] text-left text-[15px] active:bg-elevated"
          :class="activeKey === key ? 'font-semibold text-highlighted' : 'text-default'"
          @click="internals.tableColumns.setSortKey(key)"
        >
          <span
            class="size-[7px] shrink-0 rounded-full transition-colors"
            :class="
              activeKey === key
                ? 'bg-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]'
                : 'bg-accented'
            "
          />
          <span class="min-w-0 flex-1 truncate">{{ sortLabels.get(key) ?? humanize(key) }}</span>
          <UIcon
            v-if="activeKey === key"
            :name="activeDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
            class="size-3.5 text-primary"
          />
        </button>
      </div>
      <div
        class="nut-dl-sheet__title mt-2 border-t border-default px-5 pt-4 pb-2 text-[11px] font-semibold tracking-[0.06em] text-dimmed uppercase"
      >
        {{ t('table.filters.sheet.order') }}
      </div>
      <div class="mx-4 mb-5 grid grid-cols-2 gap-0.5 rounded-md bg-elevated p-0.5">
        <button
          v-for="dir in ['asc', 'desc'] as const"
          :key="dir"
          type="button"
          class="flex h-8 items-center justify-center gap-1.5 rounded-[5px] text-[12.5px] font-medium"
          :class="
            activeDirection === dir
              ? 'bg-default text-highlighted shadow-[0_0_0_1px_var(--ui-border)]'
              : 'text-muted'
          "
          @click="internals.tableColumns.setSortDirection(dir)"
        >
          <UIcon
            :name="dir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
            class="size-3.5"
          />
          {{ dir === 'asc' ? 'A → Z' : 'Z → A' }}
        </button>
      </div>
    </template>
  </UDrawer>

  <UDropdownMenu
    v-else-if="visible"
    :size="resolvedSize"
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
  </UDropdownMenu>
</template>
