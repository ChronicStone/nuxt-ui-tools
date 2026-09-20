<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListContentUi, DataListControlSize } from '../../types'
import { mergeDataListUiClass, resolveDataListControlGeometry } from '../../utils'

const props = defineProps<{
  minHeight?: string
  size?: DataListControlSize
  ui?: DataListContentUi
}>()
const emit = defineEmits<{ retry: [] }>()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const rootUi = computed(() => dataListUi.ui.value.content?.ui)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.content?.size ?? dataListUi.controlSize.value,
)
const geometry = computed(() => resolveDataListControlGeometry(resolvedSize.value))
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        'grid place-items-center px-4 py-10 text-center',
        rootUi?.error,
        ui?.error,
      )
    "
    :style="{ minHeight }"
  >
    <div
      :class="
        mergeDataListUiClass(
          `flex max-w-md items-start text-left ${geometry.toolbarGap}`,
          rootUi?.errorBody,
          ui?.errorBody,
        )
      "
    >
      <span
        :class="
          mergeDataListUiClass(
            'grid size-9 shrink-0 place-items-center rounded-md bg-error/10 text-error',
            rootUi?.errorIcon,
            ui?.errorIcon,
          )
        "
      >
        <UIcon name="i-lucide-cloud-alert" class="size-4" />
      </span>
      <div
        :class="
          mergeDataListUiClass(
            `min-w-0 flex-1 ${geometry.text}`,
            rootUi?.errorCopy,
            ui?.errorCopy,
          )
        "
      >
        <div
          :class="
            mergeDataListUiClass(
              'font-medium text-highlighted',
              rootUi?.errorTitle,
              ui?.errorTitle,
            )
          "
        >
          {{ t('table.states.gridError.title') }}
        </div>
        <p
          :class="
            mergeDataListUiClass(
              'mt-0.5 leading-5 text-muted',
              rootUi?.errorDescription,
              ui?.errorDescription,
            )
          "
        >
          {{ t('table.states.gridError.description') }}
        </p>
        <UButton
          color="neutral"
          variant="soft"
          :size="resolvedSize"
          icon="i-lucide-refresh-cw"
          class="mt-3"
          :ui="{ base: mergeDataListUiClass(rootUi?.retry, ui?.retry) }"
          @click="emit('retry')"
        >
          {{ t('table.states.gridError.action') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
