<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type {
  DataListBadgeProps,
  DataListButtonProps,
  TableFilterOperator,
} from '../../../types'
import {
  mergeDataListProps,
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
  previewEntries?: Array<{ label: string; icon?: string; color?: string }>
  previewSummary?: string
  active?: boolean
  dynamic?: boolean
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
const controlProps = computed(() => dataListUi.ui.value.filterTags?.props)
const triggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', variant: 'ghost', size: size.value },
    controlProps.value?.trigger,
  ),
)
const activeProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', variant: 'ghost', size: size.value },
    controlProps.value?.activeTrigger,
  ),
)
const operatorProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(activeProps.value, controlProps.value?.operatorTrigger),
)
const valueProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(activeProps.value, controlProps.value?.value),
)
const dismissProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(activeProps.value, controlProps.value?.dismiss),
)
const badgeProps = computed(() =>
  controlProps.value?.previewBadge
    ? mergeDataListProps<DataListBadgeProps>(
        { color: 'neutral', variant: 'subtle', size: nestedSize.value },
        controlProps.value.previewBadge,
      )
    : null,
)
const DORMANT_CLASS =
  'nut-dl-tag nut-dl-tag--dormant min-w-0 shrink-0 border border-dashed border-[var(--ui-border-accented)] text-muted hover:text-default hover:border-[var(--ui-text-dimmed)]'
const previewItems = computed<Array<{ label: string; icon?: string; color?: string }>>(() =>
  props.previewEntries?.length
    ? props.previewEntries
    : (props.previewTags ?? []).map((label) => ({ label })),
)
const labelClass = computed(() => `flex min-w-0 items-center ${geometry.value.toolbarGap}`)
</script>

<template>
  <div
    :class="mergeDataListUiClass('inline-flex min-w-0 max-w-full align-top', undefined, ui?.root)"
  >
    <template v-if="showOperatorPickerFirst">
      <UButton
        v-bind="triggerProps"
        :ui="{ base: mergeDataListUiClass(DORMANT_CLASS, undefined, ui?.trigger) }"
        @click.stop="emit('requestMatchMode')"
      >
        <span :class="mergeDataListUiClass(labelClass, undefined, ui?.label)">
          <UIcon v-if="controlProps?.icon !== false" :name="props.leadingIcon" :class="[geometry.icon, 'shrink-0 text-muted']" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>
    </template>

    <UButton
      v-else-if="!props.active"
      v-bind="triggerProps"
      :ui="{ base: mergeDataListUiClass(DORMANT_CLASS, undefined, ui?.trigger) }"
      @click.stop="emit('activate', props.operator)"
    >
      <span :class="mergeDataListUiClass(labelClass, undefined, ui?.label)">
        <UIcon v-if="controlProps?.icon !== false" :name="props.leadingIcon" :class="[geometry.icon, 'shrink-0 text-muted']" />
        <span class="truncate">{{ props.label }}</span>
      </span>
    </UButton>

    <UFieldGroup
      v-else
      :size="size"
      :class="
        mergeDataListUiClass(
          'nut-dl-tag nut-dl-tag--active min-w-0 max-w-full rounded-md bg-elevated ring ring-inset ring-default',
          undefined,
          ui?.activeRoot,
        )
      "
    >
      <UButton
        v-bind="activeProps"
        :ui="{ base: mergeDataListUiClass('nut-dl-tag__label min-w-0 shrink-0 pr-1 text-muted hover:bg-transparent', undefined, ui?.activeTrigger) }"
        @click.stop="emit('activate', props.operator)"
      >
        <span :class="mergeDataListUiClass(labelClass, undefined, ui?.label)">
          <UIcon v-if="controlProps?.icon !== false" :name="props.leadingIcon" :class="[geometry.icon, 'shrink-0 text-muted']" />
          <span class="truncate">{{ props.label }}</span>
        </span>
      </UButton>

      <UButton
        v-if="showMatchMode"
        v-bind="operatorProps"
        :label="props.operatorLabel"
        trailing-icon="i-lucide-chevron-down"
        :ui="{ base: mergeDataListUiClass('shrink-0', undefined, ui?.operatorTrigger) }"
        @click.stop="emit('requestMatchMode')"
      />

      <UButton
        v-bind="valueProps"
        :ui="{
          base: mergeDataListUiClass(
            'nut-dl-tag__value min-w-0 max-w-[min(22rem,45vw)] overflow-hidden px-1 hover:bg-transparent',
            undefined,
            ui?.value,
          ),
        }"
        @click.stop="emit('activate', props.operator)"
      >
        <span class="flex min-w-0 items-center gap-[5px] overflow-hidden">
          <template v-if="badgeProps">
            <UBadge
              v-for="item in previewItems"
              :key="item.label"
              v-bind="badgeProps"
              class="nut-dl-tag__badge max-w-28 min-w-0 shrink"
            >
              <span class="truncate">{{ item.label }}</span>
            </UBadge>
          </template>
          <template v-else>
            <template v-for="(item, index) in previewItems" :key="item.label">
              <span v-if="index && !item.color" class="nut-dl-tag__sep text-dimmed" aria-hidden="true">·</span>
              <span class="nut-dl-tag__text flex min-w-0 items-center gap-[5px] font-medium text-highlighted">
                <span
                  v-if="item.color"
                  class="nut-dl-tag__dot size-[7px] shrink-0 rounded-full"
                  :style="{ background: item.color }"
                  aria-hidden="true"
                />
                <UIcon v-else-if="item.icon" :name="item.icon" class="size-3.5 shrink-0 text-muted" />
                <span class="max-w-40 truncate">{{ item.label }}</span>
              </span>
            </template>
          </template>

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
        v-bind="dismissProps"
        :icon="props.dynamic ? 'i-lucide-x' : 'i-lucide-chevron-down'"
        square
        :aria-label="props.dynamic ? 'Clear filter' : props.label"
        :ui="{ base: mergeDataListUiClass('nut-dl-tag__dismiss shrink-0 pl-0.5 text-dimmed hover:bg-transparent hover:text-default', undefined, ui?.dismiss), leadingIcon: 'size-3' }"
        @pointerdown.stop
        @click.stop="props.dynamic ? emit('clear') : emit('activate', props.operator)"
      />
    </UFieldGroup>
  </div>
</template>
