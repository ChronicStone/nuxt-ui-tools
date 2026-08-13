<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { TableFilterOperator } from '../../../types'
import { mergeDataListUiClass } from '../../../utils'
import FilterMatchModeButton from './FilterMatchModeButton.vue'

const props = defineProps<{
  label: string
  leadingIcon: string
  operatorLabel: string
  operatorItems: Array<{ label: string; value: TableFilterOperator }>
  previewTags?: string[]
  previewSummary?: string
  active?: boolean
}>()

const emit = defineEmits<{
  selectOperator: [value: TableFilterOperator]
  activate: [operator: TableFilterOperator]
  clear: []
}>()

const showMatchMode = computed(() => props.operatorItems.length > 1)
const showOperatorPickerFirst = computed(() => !props.active && showMatchMode.value)
const dataListUi = useDataListUi()
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const ui = computed(() => dataListUi.ui.value.filterTags?.ui)
</script>

<template>
  <div
    :class="mergeDataListUiClass('inline-flex min-w-0 max-w-full align-top', undefined, ui?.root)"
  >
    <UDropdownMenu
      v-if="showOperatorPickerFirst"
      :items="[
        operatorItems.map((item) => ({
          label: item.label,
          onSelect: () => {
            emit('activate', item.value)
          },
        })),
      ]"
      :content="{ side: 'bottom', align: 'start', sideOffset: 6 }"
      :ui="{ content: 'w-fit p-1 shadow-none' }"
    >
      <UButton
        color="neutral"
        :variant="props.active ? 'subtle' : 'outline'"
        :size="size"
        :ui="{ base: mergeDataListUiClass('min-w-0 shrink-0', undefined, ui?.trigger) }"
        @pointerdown.stop
        @click.stop
      >
        <span
          :class="mergeDataListUiClass('flex min-w-0 items-center gap-2', undefined, ui?.label)"
        >
          <UIcon :name="props.leadingIcon" class="size-4 shrink-0 text-muted" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>
    </UDropdownMenu>

    <UButton
      v-else-if="!props.active"
      color="neutral"
      variant="outline"
      :size="size"
      :ui="{ base: mergeDataListUiClass('min-w-0 shrink-0', undefined, ui?.trigger) }"
    >
      <span :class="mergeDataListUiClass('flex min-w-0 items-center gap-2', undefined, ui?.label)">
        <UIcon :name="props.leadingIcon" class="size-4 shrink-0 text-muted" />
        <span class="truncate">{{ props.label }}</span>
      </span>
    </UButton>

    <UFieldGroup v-else :size="size" class="min-w-0 max-w-full">
      <UButton
        color="neutral"
        variant="subtle"
        :size="size"
        :ui="{ base: mergeDataListUiClass('shrink-0', undefined, ui?.trigger) }"
      >
        <span
          :class="mergeDataListUiClass('flex min-w-0 items-center gap-2', undefined, ui?.label)"
        >
          <UIcon :name="props.leadingIcon" class="size-4 shrink-0 text-muted" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>

      <FilterMatchModeButton
        v-if="showMatchMode"
        :label="props.operatorLabel"
        :items="props.operatorItems"
        @select="emit('selectOperator', $event)"
      />

      <UButton
        color="neutral"
        variant="subtle"
        :size="size"
        :ui="{ base: mergeDataListUiClass('min-w-0 max-w-full', undefined, ui?.value) }"
      >
        <span class="flex min-w-0 items-center gap-2">
          <UBadge
            color="neutral"
            size="sm"
            variant="subtle"
            v-for="tag in props.previewTags ?? []"
            :key="tag"
          >
            {{ tag }}
          </UBadge>

          <span v-if="props.previewSummary">
            {{ props.previewSummary }}
          </span>

          <span
            v-if="!(props.previewTags?.length ?? 0) && !props.previewSummary"
            class="text-muted"
          >
            Select…
          </span>
        </span>
      </UButton>

      <UButton
        color="neutral"
        variant="subtle"
        :size="size"
        icon="i-lucide-x"
        :ui="{ base: mergeDataListUiClass('shrink-0', undefined, ui?.dismiss) }"
        @pointerdown.stop
        @click.stop="emit('clear')"
      />
    </UFieldGroup>
  </div>
</template>
