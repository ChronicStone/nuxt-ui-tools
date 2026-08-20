<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type {
  DataListControlSize,
  DataListFilterEditorUi,
  TableFilterOperator,
} from '../../../types'
import { mergeDataListUiClass, resolveDataListControlGeometry } from '../../../utils'
import FilterMatchModePanel from './FilterMatchModePanel.vue'

const props = withDefaults(
  defineProps<{
    label: string
    items?: Array<{ label: string; value: TableFilterOperator }>
    selected?: TableFilterOperator
    variant?: 'default' | 'compact'
    size?: DataListControlSize
    ui?: DataListFilterEditorUi
  }>(),
  {
    items: () => [],
    variant: 'default',
  },
)

const emit = defineEmits<{
  select: [value: TableFilterOperator]
}>()

const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const inheritedPart = computed(() =>
  props.variant === 'compact' ? dataListUi.ui.value.filterPanel : dataListUi.ui.value.filterTags,
)
const resolvedSize = computed(
  () => props.size ?? inheritedPart.value?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed(() => ({ ...inheritedPart.value?.ui, ...props.ui }))
const geometry = computed(() => resolveDataListControlGeometry(resolvedSize.value))
const isOpen = ref<boolean>(false)
const isInteractive = computed(() => props.items.length > 1)

function select(value: TableFilterOperator) {
  isOpen.value = false
  emit('select', value)
}
</script>

<template>
  <template v-if="variant === 'compact'">
    <UPopover
      v-if="isInteractive"
      v-model:open="isOpen"
      :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
      :ui="{
        content: mergeDataListUiClass(
          'w-[13rem] overflow-hidden rounded-lg border border-default bg-default p-0 shadow-lg',
          undefined,
          resolvedUi.operatorContent,
        ),
      }"
    >
      <button
        type="button"
        :class="[
          'inline-flex items-center rounded-sm font-normal text-muted transition-colors hover:text-default focus-visible:outline-2 focus-visible:outline-primary/30',
          geometry.caption,
          geometry.toolbarGap,
          resolvedUi.operatorTrigger,
        ]"
        @pointerdown.stop
        @click.stop
      >
        <span>{{ label }}</span>
        <UIcon name="i-lucide-chevron-down" :class="[geometry.smallIcon, 'opacity-60']" />
      </button>

      <template #content>
        <FilterMatchModePanel
          :title="t('table.filters.panel.matchMode')"
          :items="items"
          :selected="selected"
          :size="resolvedSize"
          :ui="resolvedUi"
          @select="select"
        />
      </template>
    </UPopover>

    <span
      v-else
      :class="[
        'inline-flex items-center font-normal text-dimmed/80',
        geometry.caption,
        resolvedUi.operatorTrigger,
      ]"
    >
      {{ label }}
    </span>
  </template>

  <UDropdownMenu
    v-else
    :size="resolvedSize"
    :items="[
      items.map((item) => ({
        label: item.label,
        onSelect: () => emit('select', item.value),
      })),
    ]"
    :content="{ side: 'bottom', align: 'end', sideOffset: 6 }"
    :ui="{
      content: mergeDataListUiClass('w-fit p-1', undefined, resolvedUi.operatorContent),
      item: resolvedUi.operatorItem,
      itemLabel: resolvedUi.operatorLabel,
    }"
  >
    <UButton
      color="neutral"
      variant="outline"
      :size="resolvedSize"
      :label="label"
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        base: mergeDataListUiClass(undefined, undefined, resolvedUi.operatorTrigger),
      }"
      @pointerdown.stop
      @click.stop
    />
  </UDropdownMenu>
</template>
