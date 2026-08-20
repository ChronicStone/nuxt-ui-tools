<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import RowActions from '../actions/RowActions.vue'

const dataListUi = useDataListUi()
</script>

<template>
  <div class="flex justify-end">
    <RowActions
      :size="dataListUi.controlSize.value"
      :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
      :modal="false"
      portal
      :ui="{ content: 'z-[80] min-w-48' }"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-ellipsis-vertical"
        :size="dataListUi.controlSize.value"
        square
        aria-label="Row actions"
        class="bg-transparent text-muted shadow-none ring-0 hover:bg-accented/60 hover:text-default focus-visible:bg-accented/60 focus-visible:text-default"
      />
    </RowActions>
  </div>
</template>
