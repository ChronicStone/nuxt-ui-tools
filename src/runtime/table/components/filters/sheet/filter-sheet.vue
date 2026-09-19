<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isNullish } from '../../../../shared/utils/predicate'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { DataListButtonProps, TableUiFilterDefinition } from '../../../types'
import {
  getFilterLabelText,
  mergeDataListProps,
  mergeDataListUiClass,
  resolveFilterTriggerIcon,
} from '../../../utils'
import FilterStageTransition from '../shared/filter-stage-transition.vue'
import { resolveFilterTagComponent } from '../tags/registry'

const props = withDefaults(defineProps<{ showClear?: boolean }>(), { showClear: true })
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const open = ref<boolean>(false)
const selectedKey = ref<string | null>(null)
const direction = ref<'forward' | 'backward'>('forward')
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const ui = computed(() => dataListUi.ui.value.filterTags?.ui)
const controlProps = computed(() => dataListUi.ui.value.filterTags?.props)
const triggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', icon: 'i-lucide-funnel', size: size.value, variant: 'outline' },
    controlProps.value?.sheetTrigger,
  ),
)

const definitions = computed<TableUiFilterDefinition[]>(
  () => internals.filters.definitions.value as TableUiFilterDefinition[],
)
const selectedDefinition = computed(() =>
  definitions.value.find((definition) => definition.key === selectedKey.value),
)
const activeCount = computed(
  () =>
    definitions.value.filter(
      (definition) => !isNullish(internals.filters.getActiveFilterState({ key: definition.key })),
    ).length,
)

function label(definition: TableUiFilterDefinition) {
  return getFilterLabelText({ label: definition.label })
}

function preview(definition: TableUiFilterDefinition) {
  const options =
    definition.kind === 'option' && Array.isArray(definition.source?.options)
      ? definition.source.options
      : []
  return internals.filters.getFilterPreview({
    entries: options
      .filter((option) => option.value !== undefined)
      .map((option) => ({
        color: option.color,
        icon: option.icon,
        label: getFilterLabelText({ label: option.label }),
        value: option.value as string | number | boolean,
      })),
    key: definition.key,
  })
}

function select(definition: TableUiFilterDefinition) {
  direction.value = 'forward'
  selectedKey.value = definition.key
}

function back() {
  direction.value = 'backward'
  selectedKey.value = null
}

function close() {
  open.value = false
  selectedKey.value = null
}

function clearAll() {
  internals.filters.clearAllFilters()
  internals.filters.searchQuery.value = ''
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    direction="bottom"
    :handle="true"
    :title="t('table.filters.panel.trigger')"
    :ui="{
      header: 'sr-only',
      content: mergeDataListUiClass(
        'nut-dl-sheet max-h-[85vh] rounded-t-[16px]',
        undefined,
        ui?.sheetContent,
      ),
      container: 'gap-0 p-0',
      body: 'flex min-h-0 flex-col p-0 pb-2',
    }"
    @update:open="(value) => !value && (selectedKey = null)"
  >
    <UButton
      v-bind="triggerProps"
      :ui="{
        base: mergeDataListUiClass('nut-dl-sheet-trigger shrink-0', undefined, ui?.sheetTrigger),
      }"
    >
      <span class="flex items-center gap-2">
        <span>{{ t('table.filters.panel.trigger') }}</span>
        <UBadge
          v-if="activeCount"
          color="neutral"
          variant="solid"
          size="xs"
          :label="String(activeCount)"
          class="tabular-nums"
        />
      </span>
    </UButton>

    <template #body>
      <FilterStageTransition :stage-key="selectedKey ?? '__list'" :direction="direction">
        <div v-if="!selectedDefinition" class="nut-dl-sheet__list flex min-h-0 flex-col">
          <div class="nut-dl-sheet__title px-5 pt-3 pb-1.5 text-[13px] font-semibold text-muted">
            {{ t('table.filters.panel.trigger') }}
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-[10px] pb-2">
            <button
              v-for="definition in definitions"
              :key="definition.key"
              type="button"
              class="nut-dl-sheet__row flex h-[46px] w-full items-center gap-[10px] rounded-lg px-[10px] text-left text-[15px] text-highlighted active:bg-elevated"
              @click="select(definition)"
            >
              <UIcon
                :name="resolveFilterTriggerIcon(definition)"
                class="size-3.5 shrink-0 text-muted"
              />
              <span class="min-w-0 flex-1 truncate">{{ label(definition) }}</span>
              <span
                class="nut-dl-sheet__value flex min-w-0 items-center gap-2 text-[12px] font-semibold"
              >
                <template v-for="(entry, index) in preview(definition).entries" :key="entry.label">
                  <span v-if="index && !entry.color" class="text-dimmed">·</span>
                  <span class="flex items-center gap-1.5">
                    <span
                      v-if="entry.color"
                      class="size-[7px] rounded-full"
                      :style="{ background: entry.color }"
                    />
                    <span class="max-w-28 truncate">{{ entry.label }}</span>
                  </span>
                </template>
                <span
                  v-if="!preview(definition).entries.length && preview(definition).summary"
                  class="max-w-40 truncate"
                >
                  {{ preview(definition).summary }}
                </span>
              </span>
              <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 text-dimmed" />
            </button>
          </div>
          <div
            class="nut-dl-sheet__footer flex items-center justify-between border-t border-default px-5 pt-3 pb-1 text-[13px]"
          >
            <button
              v-if="showClear"
              type="button"
              class="text-muted disabled:opacity-40"
              :disabled="
                !internals.filters.hasActiveUiFilters.value && !internals.filters.searchQuery.value
              "
              @click="clearAll"
            >
              {{ t('table.filters.panel.clearAll') }}
            </button>
            <span v-else />
            <button type="button" class="font-medium text-highlighted" @click="close">
              {{ t('table.filters.sheet.done') }}
            </button>
          </div>
        </div>

        <div v-else class="nut-dl-sheet__detail flex min-h-0 flex-col">
          <div class="flex items-center gap-2 px-[10px] pt-2 pb-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-arrow-left"
              square
              :aria-label="t('table.filters.sheet.back')"
              @click="back"
            />
            <span class="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-highlighted">{{
              label(selectedDefinition)
            }}</span>
            <button
              type="button"
              class="px-2 text-[13px] font-semibold text-primary disabled:opacity-40"
              :disabled="!preview(selectedDefinition).active"
              @click="internals.filters.clearFilter({ key: selectedDefinition.key })"
            >
              {{ t('table.filters.editor.clear') }}
            </button>
          </div>
          <div class="nut-dl-sheet__editor min-h-0 flex-1 overflow-y-auto px-[10px] pb-2">
            <component
              :is="resolveFilterTagComponent(selectedDefinition)"
              :key="selectedDefinition.key"
              :definition="selectedDefinition"
              :dynamic="
                internals.filterPresentation.activeDynamicDefinitions.value.some(
                  (item) => item.key === selectedDefinition!.key,
                ) ||
                internals.filterPresentation.dormantDynamicDefinitions.value.some(
                  (item) => item.key === selectedDefinition!.key,
                )
              "
              embedded
              session
              :header="false"
              @session-closed="back"
              @dismiss="back"
            />
          </div>
        </div>
      </FilterStageTransition>
    </template>
  </UDrawer>
</template>

<style>
.nut-dl-sheet__value {
  color: var(--nut-dl-accent-ink, var(--ui-primary));
}
</style>
