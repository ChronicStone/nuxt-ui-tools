<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref } from 'vue'

import { isBoolean } from '../../../../shared/utils/predicate'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableBooleanFilterDefinition, TableBooleanFilterOperator } from '../../../types'
import {
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveBooleanFilterUi,
  resolveFilterEditorSizeClasses,
  resolveFilterTriggerIcon,
} from '../../../utils'
import FilterPopoverShell from '../shared/FilterPopoverShell.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableBooleanFilterDefinition
  dynamic?: boolean
  session?: boolean
  embedded?: boolean
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const dataListFilterUi = computed(() => dataListUi.ui.value.filterTags?.ui)
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
const geometry = computed(() => resolveDataListControlGeometry(size.value))
const searchQuery = ref<string>('')
const isSessionOpen = ref<boolean>(false)
const isContentReady = ref<boolean>(false)
const localValue = ref<boolean | null>(null)

const optionSource = useTableFilterOptions({
  definition: props.definition,
  active: computed(() => isSessionOpen.value),
  ready: isContentReady,
  searchQuery,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
})

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
    entries: optionSource.sourceEntries.value,
  }),
)

const operator = computed<TableBooleanFilterOperator>(() => {
  const value = internals.filters.getFilterOperator({
    key: props.definition.key,
  })

  return value === 'isNot' ? 'isNot' : 'is'
})

const filterUi = computed(() => resolveBooleanFilterUi(props.definition, operator.value))

const entries = computed(() =>
  optionSource.filteredEntries.value
    .filter((entry) => isBoolean(entry.value))
    .map((entry) => ({
      ...entry,
      label: entry.value === true ? filterUi.value.labels.true : filterUi.value.labels.false,
      icon: entry.value === true ? filterUi.value.icons.true : filterUi.value.icons.false,
      selected: localValue.value === entry.value,
    })),
)

const radioItems = computed(() =>
  entries.value.map((entry) => ({
    label: entry.label,
    value: String(entry.value),
    count: entry.count,
    icon: entry.icon,
  })),
)

const radioValue = computed({
  get: () => (localValue.value == null ? undefined : String(localValue.value)),
  set: (value: string | undefined) => {
    if (value === 'true') localValue.value = true
    else if (value === 'false') localValue.value = false
    else return

    if (filterUi.value.commitMode === 'auto') applyFilter()
  },
})

const session = useFilterTagSession({
  isOpen: isSessionOpen,
  session: props.session,
  dynamic: props.dynamic,
  embedded: props.embedded,
  hasCommittedState: () =>
    internals.filters.getActiveFilterState({ key: props.definition.key }) != null,
  onOpen: initLocalState,
  onClose: () => {
    isContentReady.value = false
  },
  onSessionClosed: () => emit('sessionClosed'),
  onDismiss: () => emit('dismiss'),
})

function initLocalState() {
  const committedRule = internals.filters.getFilterState({
    key: props.definition.key,
  })

  if (committedRule?.value === true || committedRule?.value === false) {
    localValue.value = committedRule.value
    return
  }

  localValue.value = null
}

function handleActivate() {
  session.open()
}

function handleContentMounted() {
  isContentReady.value = true
}

function applyFilter() {
  if (localValue.value == null) {
    internals.filters.clearFilter({ key: props.definition.key })
  } else {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: localValue.value,
    })
  }

  session.close()
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  session.close()
}
</script>

<template>
  <FilterPopoverShell
    :open="session.isOpen.value"
    :embedded="embedded"
    :content-class="
      mergeDataListUiClass(
        `${sizeClasses.editor} overflow-hidden p-0`,
        undefined,
        dataListFilterUi?.popoverContent,
      )
    "
    @update-open="session.handleOpenChange"
  >
    <slot
      name="trigger"
      :preview="preview"
      :active="preview.active"
      :open="session.isOpen.value"
      :trigger-props="{
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': session.isOpen.value,
      }"
    >
      <TableFilterTrigger
        :label="internals.filters.getFilterLabelText({ label: definition.label })"
        :leading-icon="resolveFilterTriggerIcon(definition)"
        :operator="operator"
        operator-label="is"
        :operator-items="[]"
        :preview-tags="preview.tags"
        :preview-summary="preview.summary"
        :active="preview.active"
        @activate="handleActivate"
        @clear="clearFilter"
      />
    </slot>

    <template #content>
      <div
        :class="
          mergeDataListUiClass(
            `${sizeClasses.editor} w-full min-w-0 max-w-full bg-default`,
            undefined,
            dataListFilterUi?.editor,
          )
        "
        @vue:mounted="handleContentMounted"
      >
        <div
          :class="mergeDataListUiClass(sizeClasses.scrollArea, undefined, dataListFilterUi?.list)"
        >
          <URadioGroup
            v-model="radioValue"
            :items="radioItems"
            color="neutral"
            variant="list"
            :size="size"
            :ui="{
              root: 'w-full',
              fieldset: 'grid gap-0.5',
              item: mergeDataListUiClass(
                `flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated ${sizeClasses.option}`,
                undefined,
                dataListFilterUi?.option,
              ),
              container: 'self-center',
              base: 'cursor-pointer',
              wrapper: 'min-w-0 flex-1',
              label: mergeDataListUiClass(
                `w-full cursor-pointer text-default ${sizeClasses.optionLabel}`,
                undefined,
                dataListFilterUi?.optionLabel,
              ),
            }"
          >
            <template #label="{ item }">
              <div :class="['flex min-w-0 items-center', geometry.toolbarGap]">
                <UIcon
                  v-if="typeof item.icon === 'string'"
                  :name="item.icon"
                  :class="
                    mergeDataListUiClass(
                      `${sizeClasses.optionIcon} shrink-0 text-muted`,
                      undefined,
                      dataListFilterUi?.optionIcon,
                    )
                  "
                />

                <span class="min-w-0 flex-1 truncate">
                  {{ item.label }}
                </span>
                <USkeleton v-if="optionSource.isCountLoading.value" class="h-3.5 w-6 shrink-0" />
                <span
                  v-else-if="item.count != null"
                  :class="
                    mergeDataListUiClass(
                      'shrink-0 text-muted',
                      undefined,
                      dataListFilterUi?.optionCount,
                    )
                  "
                >
                  {{ item.count }}
                </span>
              </div>
            </template>
          </URadioGroup>
        </div>

        <div
          v-if="filterUi.commitMode === 'manual'"
          :class="
            mergeDataListUiClass(
              `flex items-center justify-between border-t border-default ${sizeClasses.footer}`,
              undefined,
              dataListFilterUi?.footer,
            )
          "
        >
          <UButton
            color="neutral"
            variant="ghost"
            :size="size"
            :label="filterUi.actions.clear"
            :ui="{ base: dataListFilterUi?.clear }"
            @click="clearFilter"
          />
          <UButton
            color="neutral"
            variant="subtle"
            :size="size"
            :label="filterUi.actions.apply"
            :ui="{ base: dataListFilterUi?.apply }"
            @click="applyFilter"
          />
        </div>
      </div>
    </template>
  </FilterPopoverShell>
</template>
