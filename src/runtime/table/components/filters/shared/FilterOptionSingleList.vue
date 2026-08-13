<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass, resolveFilterEditorSizeClasses } from '../../../utils'

const props = defineProps<{
  items: Array<{
    label: string
    value: string
    count?: number
    icon?: string
    truncate?: boolean
  }>
  countLoading: boolean
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const dataListUi = useDataListUi()
const size = computed(
  () => props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
)
const ui = computed(() => props.ui ?? dataListUi.ui.value.filterTags?.ui)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))

const modelValue = defineModel<string | undefined>({
  default: undefined,
})
</script>

<template>
  <URadioGroup
    v-if="items.length"
    v-model="modelValue"
    :items="items"
    color="neutral"
    variant="list"
    :size="size"
    :ui="{
      root: 'w-full',
      fieldset: mergeDataListUiClass('grid gap-0.5', undefined, ui?.list),
      item: mergeDataListUiClass(
        `flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated ${sizeClasses.option}`,
        undefined,
        ui?.option,
      ),
      container: 'self-center',
      base: 'cursor-pointer',
      wrapper: 'min-w-0 flex-1',
      label: mergeDataListUiClass(
        `w-full cursor-pointer text-default ${sizeClasses.optionLabel}`,
        undefined,
        ui?.optionLabel,
      ),
    }"
  >
    <template #label="{ item }">
      <div class="flex min-w-0 items-center gap-2">
        <UIcon
          v-if="typeof item.icon === 'string'"
          :name="item.icon"
          :class="
            mergeDataListUiClass(
              `${sizeClasses.optionIcon} shrink-0 text-muted`,
              undefined,
              ui?.optionIcon,
            )
          "
        />

        <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
          {{ item.label }}
        </span>
        <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
        <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
          {{ item.count }}
        </span>
      </div>
    </template>
  </URadioGroup>
</template>
