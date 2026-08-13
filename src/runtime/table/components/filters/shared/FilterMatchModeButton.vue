<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type {
  DataListControlSize,
  DataListFilterEditorUi,
  TableFilterOperator,
} from '../../../types'
import { mergeDataListUiClass } from '../../../utils'

const props = withDefaults(
  defineProps<{
    label: string
    items?: Array<{ label: string; value: TableFilterOperator }>
    variant?: 'default' | 'compact'
    size?: DataListControlSize
    ui?: DataListFilterEditorUi
  }>(),
  {
    items: () => [],
    variant: 'default',
  },
)

const dataListUi = useDataListUi()
const inheritedPart = computed(() =>
  props.variant === 'compact' ? dataListUi.ui.value.filterPanel : dataListUi.ui.value.filterTags,
)
const resolvedSize = computed(
  () => props.size ?? inheritedPart.value?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed(() => ({ ...inheritedPart.value?.ui, ...props.ui }))

const emit = defineEmits<{
  select: [value: TableFilterOperator]
}>()
</script>

<template>
  <UDropdownMenu
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
      :variant="variant === 'compact' ? 'ghost' : 'outline'"
      :size="resolvedSize"
      :label="label"
      trailing-icon="i-lucide-chevron-down"
      :ui="{
        base: mergeDataListUiClass(
          variant === 'compact' ? 'px-2.5' : undefined,
          undefined,
          resolvedUi.operatorTrigger,
        ),
      }"
      @pointerdown.stop
      @click.stop
    />
  </UDropdownMenu>
</template>
