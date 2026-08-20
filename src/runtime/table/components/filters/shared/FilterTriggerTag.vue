<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { TableFilterOperator } from '../../../types'
import {
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveDataListNestedControlSize,
} from '../../../utils'

const props = defineProps<{
  label: string
  leadingIcon: string
  operator: TableFilterOperator
  operatorLabel: string
  operatorItems: Array<{ label: string; value: TableFilterOperator }>
  previewTags?: string[]
  previewSummary?: string
  active?: boolean
}>()

const emit = defineEmits<{
  activate: [operator: TableFilterOperator]
  requestMatchMode: []
  clear: []
}>()

const showMatchMode = computed(() => props.operatorItems.length > 1)
const showOperatorPickerFirst = computed(() => !props.active && showMatchMode.value)
const dataListUi = useDataListUi()
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const nestedSize = computed(() => resolveDataListNestedControlSize(size.value))
const geometry = computed(() => resolveDataListControlGeometry(size.value))
const ui = computed(() => dataListUi.ui.value.filterTags?.ui)
const labelClass = computed(() => `flex min-w-0 items-center ${geometry.value.toolbarGap}`)
</script>

<template>
  <div
    :class="mergeDataListUiClass('inline-flex min-w-0 max-w-full align-top', undefined, ui?.root)"
  >
    <template v-if="showOperatorPickerFirst">
      <UButton
        color="neutral"
        :variant="props.active ? 'subtle' : 'outline'"
        :size="size"
        :ui="{ base: mergeDataListUiClass('min-w-0 shrink-0', undefined, ui?.trigger) }"
        @click.stop="emit('requestMatchMode')"
      >
        <span :class="mergeDataListUiClass(labelClass, undefined, ui?.label)">
          <UIcon :name="props.leadingIcon" :class="[geometry.icon, 'shrink-0 text-muted']" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>
    </template>

    <UButton
      v-else-if="!props.active"
      color="neutral"
      variant="outline"
      :size="size"
      :ui="{ base: mergeDataListUiClass('min-w-0 shrink-0', undefined, ui?.trigger) }"
      @click.stop="emit('activate', props.operator)"
    >
      <span :class="mergeDataListUiClass(labelClass, undefined, ui?.label)">
        <UIcon :name="props.leadingIcon" :class="[geometry.icon, 'shrink-0 text-muted']" />
        <span class="truncate">{{ props.label }}</span>
      </span>
    </UButton>

    <UFieldGroup v-else :size="size" class="min-w-0 max-w-full">
      <UButton
        color="neutral"
        variant="subtle"
        :size="size"
        :ui="{ base: mergeDataListUiClass('min-w-0 shrink-0', undefined, ui?.trigger) }"
        @click.stop="emit('activate', props.operator)"
      >
        <span :class="mergeDataListUiClass(labelClass, undefined, ui?.label)">
          <UIcon :name="props.leadingIcon" :class="[geometry.icon, 'shrink-0 text-muted']" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>

      <UButton
        v-if="showMatchMode"
        color="neutral"
        variant="subtle"
        :size="size"
        :label="props.operatorLabel"
        trailing-icon="i-lucide-chevron-down"
        :ui="{ base: mergeDataListUiClass('shrink-0', undefined, ui?.operatorTrigger) }"
        @click.stop="emit('requestMatchMode')"
      />

      <UButton
        color="neutral"
        variant="subtle"
        :size="size"
        :ui="{
          base: mergeDataListUiClass(
            'min-w-0 max-w-[min(22rem,45vw)] overflow-hidden',
            undefined,
            ui?.value,
          ),
        }"
        @click.stop="emit('activate', props.operator)"
      >
        <span class="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <UBadge
            v-for="tag in props.previewTags ?? []"
            :key="tag"
            color="neutral"
            :size="nestedSize"
            variant="subtle"
            class="max-w-28 min-w-0 shrink"
          >
            <span class="truncate">{{ tag }}</span>
          </UBadge>

          <span v-if="props.previewSummary" class="min-w-0 truncate">
            {{ props.previewSummary }}
          </span>

          <span
            v-if="!(props.previewTags?.length ?? 0) && !props.previewSummary"
            class="truncate text-muted"
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
        square
        aria-label="Clear filter"
        :ui="{ base: mergeDataListUiClass('shrink-0', undefined, ui?.dismiss) }"
        @pointerdown.stop
        @click.stop="emit('clear')"
      />
    </UFieldGroup>
  </div>
</template>
