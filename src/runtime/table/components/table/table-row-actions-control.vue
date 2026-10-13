<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListButtonProps } from '../../types'
import { mergeDataListProps } from '../../utils'
import RowActions from '../actions/row-actions.vue'

const dataListUi = useDataListUi()
const ui = computed(() => dataListUi.ui.value.table?.ui)
const buttonProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    {
      color: 'neutral',
      icon: 'i-lucide-ellipsis',
      size: dataListUi.controlSize.value,
      variant: 'ghost',
    },
    dataListUi.ui.value.table?.props?.rowActions,
  ),
)
</script>

<template>
  <div class="flex justify-end">
    <RowActions
      :size="dataListUi.controlSize.value"
      :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
      :modal="false"
      portal
      :ui="{
        content: 'z-[80] min-w-48',
        item: 'nut-dl-menu__item gap-2 text-[13px]',
        itemLeadingIcon: 'size-3.5',
      }"
    >
      <template #default="{ label }">
        <UButton
          v-bind="buttonProps"
          square
          :aria-label="label"
          :ui="{ base: ui?.rowAction }"
          class="nut-dl-rowbtn text-muted hover:text-default focus-visible:text-default"
        />
      </template>
    </RowActions>
  </div>
</template>
