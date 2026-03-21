<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref, watch } from 'vue'

import { useRangeSelect } from '../../../../shared'
import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableResolvedFilterOptionEntry,
} from '../../../types'
import { flattenVisibleFilterOptionTree, resolveFilterTriggerIcon, resolveOptionFilterUi } from '../../../utils'
import FilterOptionRow from '../shared/FilterOptionRow.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
  dynamic?: boolean
  session?: boolean
  activationToken?: number
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const isOpen = ref<boolean>(false)
const isContentReady = ref<boolean>(false)
const pendingOperator = ref<TableFilterOperator>()
const localSelectedValues = ref<(string | number | boolean)[]>([])
const pinnedValues = ref<Set<string>>(new Set())
const localExpandedIds = ref<Set<string>>(new Set())
const lastActivationToken = ref<number | null>(null)

let dismissLocked = false

const optionSource = useTableFilterOptions({
  definition: props.definition,
  active: isOpen,
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

const operator = computed<TableOptionFilterOperator>(() => {
  const next =
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    })

  return next === 'isAnyOf' || next === 'isNot' ? next : 'is'
})

const operatorLabel = computed(
  () =>
    internals.filters
      .getFilterOperatorOptions({
        key: props.definition.key,
      })
      .find((item) => item.value === operator.value)?.label ?? 'is',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const filterUi = computed(() => resolveOptionFilterUi(props.definition, operator.value))

const displayEntries = computed(() =>
  optionSource.filteredEntries.value.map((entry) => ({
    ...entry,
    icon: entry.icon,
    selected:
      entry.value != null &&
      localSelectedValues.value.some((value) => String(value) === String(entry.value)),
  })),
)

const displayTreeEntries = computed(() =>
  mapSelectedTreeEntries({
    entries: optionSource.filteredTreeEntries.value,
    selectedValues: localSelectedValues.value,
  }),
)

const flatRadioItems = computed(() =>
  displayEntries.value.map((entry) => ({
    label: entry.label,
    value: String(entry.value),
    count: filterUi.value.row.showCounts ? entry.count : undefined,
    icon: resolveRowIcon(entry),
    truncate: filterUi.value.row.truncate,
  })),
)

const flatRadioValue = computed({
  get: () => localSelectedValues.value[0] != null ? String(localSelectedValues.value[0]) : undefined,
  set: (value: string | undefined) => {
    if (value == null) return

    const match = displayEntries.value.find(entry => String(entry.value) === value)
    if (!match) return

    localSelectedValues.value = [match.value]
    commitSelection()
  },
})

const effectiveExpandedIds = computed(
  () => new Set([...optionSource.searchExpandedIds.value, ...localExpandedIds.value]),
)

const visibleTreeEntries = computed(() =>
  flattenVisibleFilterOptionTree({
    entries: displayTreeEntries.value,
    expandedIds: effectiveExpandedIds.value,
    selectable: filterUi.value.tree.selectable,
  }),
)

const treeRadioItems = computed(() =>
  visibleTreeEntries.value.map((entry) => ({
    id: entry.id,
    label: entry.label,
    value: entry.id,
    count: filterUi.value.row.showCounts ? entry.count : undefined,
    icon: entry.icon,
    truncate: filterUi.value.row.truncate,
    depth: entry.depth,
    expandable: entry.expandable,
    expanded: effectiveExpandedIds.value.has(entry.id),
    selectable: entry.selectable,
    disabled: !entry.selectable,
  })),
)

const treeRadioValue = computed({
  get: () => {
    const selected = localSelectedValues.value[0]
    if (selected == null) return undefined

    return visibleTreeEntries.value.find(
      (entry) => entry.value != null && String(entry.value) === String(selected),
    )?.id
  },
  set: (value: string | undefined) => {
    if (value == null) return

    const match = visibleTreeEntries.value.find(entry => entry.id === value)
    if (!match || !match.selectable) return

    if (match.value == null) return
    localSelectedValues.value = [match.value]
    commitSelection()
  },
})

const pinnedEntries = computed(() =>
  displayEntries.value.filter((entry) => pinnedValues.value.has(String(entry.value))),
)

const restEntries = computed(() =>
  displayEntries.value.filter((entry) => !pinnedValues.value.has(String(entry.value))),
)

const hasPinnedSection = computed(() => pinnedEntries.value.length > 0)

const pinnedRangeSelect = useRangeSelect({
  entries: pinnedEntries,
  onToggle: toggleValue,
})

const restRangeSelect = useRangeSelect({
  entries: restEntries,
  onToggle: toggleValue,
})

function initLocalState() {
  const committedRule = internals.filters.getFilterState({ key: props.definition.key })
  const values: (string | number | boolean)[] = Array.isArray(committedRule?.value)
    ? committedRule.value.filter(
        (value: unknown): value is string | number | boolean =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
      )
    : committedRule?.value != null &&
        (typeof committedRule.value === 'string' ||
          typeof committedRule.value === 'number' ||
          typeof committedRule.value === 'boolean')
      ? [committedRule.value]
      : []

  localSelectedValues.value = values
  pinnedValues.value = new Set(values.map(String))
  localExpandedIds.value = new Set()
}

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dismissLocked = false
      })
    })
  })
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open

  if (open) {
    isContentReady.value = false
    initLocalState()
    return
  }

  isContentReady.value = false
  pendingOperator.value = undefined
  searchQuery.value = ''
  localExpandedIds.value = new Set()
  pinnedRangeSelect.reset()
  restRangeSelect.reset()
  if (props.session) emit('sessionClosed')
  else if (props.dynamic && internals.filters.getFilterState({ key: props.definition.key }) == null) emit('dismiss')
}

function handleOperatorChange(op: TableFilterOperator) {
  if (filterUi.value.clearOnOperatorChange) {
    internals.filters.clearFilter({ key: props.definition.key })
  }

  localSelectedValues.value = []
  pinnedValues.value = new Set()
  localExpandedIds.value = new Set()
  searchQuery.value = ''
  pinnedRangeSelect.reset()
  restRangeSelect.reset()

  if (filterUi.value.reopenOnOperatorChange) handleActivate(op)
  else pendingOperator.value = op
}

function toggleValue(value: string | number | boolean) {
  const exists = localSelectedValues.value.some((entry) => String(entry) === String(value))

  if (filterUi.value.selection.mode === 'single') {
    if (exists) {
      if (!filterUi.value.selection.allowEmpty) return
      localSelectedValues.value = []
    } else {
      localSelectedValues.value = [value]
    }

    commitSelection()
    return
  }

  if (exists) {
    if (!filterUi.value.selection.allowEmpty && localSelectedValues.value.length === 1) return

    localSelectedValues.value = localSelectedValues.value.filter(
      (entry) => String(entry) !== String(value),
    )
    commitSelection()
    return
  }

  if (
    filterUi.value.selection.max != null &&
    localSelectedValues.value.length >= filterUi.value.selection.max
  ) return

  localSelectedValues.value = [...localSelectedValues.value, value]
  commitSelection()
}

function toggleTreeEntry(entry: {
  value?: string | number | boolean
  selectable: boolean
  expandable: boolean
  id: string
}) {
  if (!entry.selectable) {
    if (entry.expandable) toggleExpanded(entry.id)
    return
  }

  if (entry.value == null) return
  toggleValue(entry.value)
}

function toggleExpanded(id: string) {
  const next = new Set(localExpandedIds.value)

  if (next.has(id)) next.delete(id)
  else next.add(id)

  localExpandedIds.value = next
}

function commitSelection() {
  if (filterUi.value.commitMode !== 'auto') return

  internals.filters.setOptionFilterValues({
    key: props.definition.key,
    values: localSelectedValues.value,
    operator: pendingOperator.value,
  })

  if (filterUi.value.closeOnSelect) isOpen.value = false
}

function applyFilter() {
  internals.filters.setOptionFilterValues({
    key: props.definition.key,
    values: localSelectedValues.value,
    operator: pendingOperator.value,
  })
  pendingOperator.value = undefined
  isOpen.value = false
  if (props.session) emit('sessionClosed')
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  localSelectedValues.value = []
  isOpen.value = false
  if (props.session) emit('sessionClosed')
  else if (props.dynamic) emit('dismiss')
}

function resolveRowIcon(entry: { label: string; value?: string | number | boolean; count?: number; icon?: string }) {
  if (entry.value == null) return entry.icon

  const resolved = filterUi.value.row.getIcon?.({
    label: entry.label,
    value: entry.value,
    count: entry.count,
    ...(entry.icon ? { icon: entry.icon } : {}),
  })

  return resolved ?? entry.icon
}

function getTreeIndentStyle(depth: number) {
  return {
    paddingInlineStart: `${depth * 10}px`,
  }
}

function mapSelectedTreeEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  selectedValues: (string | number | boolean)[]
}): TableResolvedFilterOptionEntry[] {
  return options.entries.map((entry) => ({
    ...entry,
    selected:
      entry.value != null &&
      options.selectedValues.some((value) => String(value) === String(entry.value)),
    children: mapSelectedTreeEntries({
      entries: entry.children,
      selectedValues: options.selectedValues,
    }),
  }))
}

function handleContentMounted() {
  isContentReady.value = true
}

watch(
  () => props.activationToken,
  (value) => {
    if (value == null || value === lastActivationToken.value) return
    lastActivationToken.value = value
    handleActivate(operator.value)
  },
  { immediate: true },
)
</script>

<template>
  <UPopover
    :open="isOpen"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{ content: 'w-fit overflow-hidden p-0 shadow-none' }"
    @update:open="handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      :leading-icon="resolveFilterTriggerIcon(definition)"
      :operator-label="operatorLabel"
      :operator-items="operatorItems"
      :preview-tags="preview.tags"
      :preview-summary="preview.summary"
      :active="preview.active"
      @select-operator="handleOperatorChange"
      @activate="handleActivate"
      @clear="clearFilter"
    />

    <template #content>
      <div
        class="w-fit max-w-[calc(100vw-1rem)] bg-default"
        @vue:mounted="handleContentMounted"
      >
        <div v-if="filterUi.searchable" class="w-full border-b border-default p-2">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            :placeholder="filterUi.labels.searchPlaceholder"
            class="w-full"
            :loading="optionSource.isStaleLoading.value"
            variant="ghost"
            :ui="{ base: 'rounded-md' }"
          />
        </div>

        <UScrollArea
          style="max-height: 320px"
          type="hover"
          class="max-h-80 p-2"
          :ui="{ root: 'max-h-80', viewport: 'max-h-80' }"
        >
          <template v-if="filterUi.presentation === 'tree'">
            <template v-if="optionSource.isLoading.value">
              <div class="grid gap-0.5">
                <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
                  <USkeleton class="size-4 shrink-0 rounded-full" />
                  <USkeleton class="h-3.5 min-w-0 flex-1" />
                  <USkeleton class="h-3.5 w-6 shrink-0" />
                </div>
              </div>
            </template>

            <div v-else-if="filterUi.selection.mode === 'multiple'" class="grid gap-0.5">
              <button
                v-for="entry in visibleTreeEntries"
                :key="entry.id"
                type="button"
                class="block w-full"
                @click="toggleTreeEntry(entry)"
              >
                <div
                  class="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-elevated"
                  :class="entry.selected ? 'bg-elevated text-highlighted' : 'text-default'"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-3" :style="getTreeIndentStyle(entry.depth)">
                    <button
                      v-if="entry.expandable"
                      type="button"
                      class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
                      :class="effectiveExpandedIds.has(entry.id) ? 'rotate-90' : ''"
                      @click.stop="toggleExpanded(entry.id)"
                    >
                      <UIcon name="i-lucide-chevron-right" class="size-4" />
                    </button>
                    <span v-else class="size-4 shrink-0" />

                    <UCheckbox
                      v-if="entry.selectable"
                      :model-value="entry.selected"
                      color="neutral"
                      size="md"
                      tabindex="-1"
                      :icon="filterUi.row.selectedIcon"
                      :ui="{ base: '!rounded-md', indicator: '!rounded-none' }"
                    />
                    <span v-else class="size-5 shrink-0" />

                    <UIcon
                      v-if="entry.icon"
                      :name="entry.icon"
                      class="size-4 shrink-0 text-muted"
                    />

                    <span class="min-w-0 flex-1" :class="filterUi.row.truncate ? 'truncate' : ''">
                      {{ entry.label }}
                    </span>
                  </div>

                  <USkeleton
                    v-if="filterUi.row.showCounts && optionSource.isCountLoading.value"
                    class="ml-3 h-3.5 w-6 shrink-0"
                  />
                  <span v-else-if="filterUi.row.showCounts && entry.count != null" class="ml-3 shrink-0 text-muted">
                    {{ entry.count }}
                  </span>
                </div>
              </button>

              <div v-if="!visibleTreeEntries.length" class="px-3 py-8 text-center text-sm text-muted">
                {{ filterUi.labels.empty }}
              </div>
            </div>

            <div v-else>
              <URadioGroup
                v-if="treeRadioItems.length"
                v-model="treeRadioValue"
                :items="treeRadioItems"
                color="neutral"
                variant="list"
                :ui="{
                  root: 'w-full',
                  fieldset: 'grid gap-0.5',
                  item: 'flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated',
                  container: 'self-center pl-3',
                  base: 'cursor-pointer',
                  wrapper: 'min-w-0 flex-1 py-2 pr-3',
                  label: 'w-full cursor-pointer text-sm text-default',
                }"
              >
                <template #label="{ item }">
                  <div class="flex min-w-0 items-center gap-3" :style="getTreeIndentStyle(item.depth)">
                    <button
                      v-if="item.expandable"
                      type="button"
                      class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
                      :class="item.expanded ? 'rotate-90' : ''"
                      @click.stop.prevent="toggleExpanded(item.id)"
                    >
                      <UIcon name="i-lucide-chevron-right" class="size-4" />
                    </button>
                    <span v-else class="size-4 shrink-0" />

                    <UIcon
                      v-if="typeof item.icon === 'string'"
                      :name="item.icon"
                      class="size-4 shrink-0 text-muted"
                    />

                    <span
                      class="min-w-0 flex-1"
                      :class="item.truncate ? 'truncate' : ''"
                    >
                      {{ item.label }}
                    </span>
                    <USkeleton
                      v-if="filterUi.row.showCounts && optionSource.isCountLoading.value"
                      class="ml-3 h-3.5 w-6 shrink-0"
                    />
                    <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
                      {{ item.count }}
                    </span>
                  </div>
                </template>
              </URadioGroup>

              <div v-else class="px-3 py-8 text-center text-sm text-muted">
                {{ filterUi.labels.empty }}
              </div>
            </div>
          </template>

          <div v-else-if="filterUi.selection.mode === 'multiple'" class="grid gap-0.5">
            <template v-if="optionSource.isLoading.value">
              <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
                <USkeleton class="size-4 shrink-0 rounded-md" />
                <USkeleton class="h-3.5 min-w-0 flex-1" />
                <USkeleton class="h-3.5 w-6 shrink-0" />
              </div>
            </template>

            <template v-else>
              <template v-if="hasPinnedSection">
                <button
                  v-for="(entry, index) in pinnedEntries"
                  :key="String(entry.value)"
                  type="button"
                  class="block w-full"
                  @click="pinnedRangeSelect.handleClick($event, entry, index)"
                >
                  <FilterOptionRow
                    :label="entry.label"
                    :count="filterUi.row.showCounts ? entry.count : undefined"
                    :count-loading="filterUi.row.showCounts && optionSource.isCountLoading.value"
                    :selected="entry.selected"
                    :leading-icon="resolveRowIcon(entry)"
                    :selected-icon="filterUi.row.selectedIcon"
                    :truncate="filterUi.row.truncate"
                  />
                </button>

                <div class="my-1 border-t border-default" />
              </template>

              <button
                v-for="(entry, index) in restEntries"
                :key="String(entry.value)"
                type="button"
                class="block w-full"
                @click="restRangeSelect.handleClick($event, entry, index)"
              >
                <FilterOptionRow
                  :label="entry.label"
                  :count="filterUi.row.showCounts ? entry.count : undefined"
                  :count-loading="filterUi.row.showCounts && optionSource.isCountLoading.value"
                  :selected="entry.selected"
                  :leading-icon="resolveRowIcon(entry)"
                  :selected-icon="filterUi.row.selectedIcon"
                  :truncate="filterUi.row.truncate"
                />
              </button>

              <div v-if="!displayEntries.length" class="px-3 py-8 text-center text-sm text-muted">
                {{ filterUi.labels.empty }}
              </div>
            </template>
          </div>

          <div v-else>
            <template v-if="optionSource.isLoading.value">
              <div class="grid gap-0.5">
                <div v-for="i in 5" :key="i" class="flex items-center gap-3 rounded-md px-3 py-2">
                  <USkeleton class="size-4 shrink-0 rounded-full" />
                  <USkeleton class="h-3.5 min-w-0 flex-1" />
                  <USkeleton class="h-3.5 w-6 shrink-0" />
                </div>
              </div>
            </template>

            <URadioGroup
              v-else-if="flatRadioItems.length"
              v-model="flatRadioValue"
              :items="flatRadioItems"
              color="neutral"
              variant="list"
              :ui="{
                root: 'w-full',
                fieldset: 'grid gap-0.5',
                item: 'flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated',
                container: 'self-center pl-3',
                base: 'cursor-pointer',
                wrapper: 'min-w-0 flex-1 py-2 pr-3',
                label: 'w-full cursor-pointer text-sm text-default',
              }"
            >
              <template #label="{ item }">
                <div class="flex min-w-0 items-center gap-3">
                  <UIcon
                    v-if="typeof item.icon === 'string'"
                    :name="item.icon"
                    class="size-4 shrink-0 text-muted"
                  />

                  <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
                    {{ item.label }}
                  </span>
                  <USkeleton
                    v-if="filterUi.row.showCounts && optionSource.isCountLoading.value"
                    class="ml-3 h-3.5 w-6 shrink-0"
                  />
                  <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
                    {{ item.count }}
                  </span>
                </div>
              </template>
            </URadioGroup>

            <div v-else class="px-3 py-6 text-center text-sm text-muted">
              {{ filterUi.labels.empty }}
            </div>
          </div>
        </UScrollArea>

        <div
          v-if="filterUi.commitMode === 'manual'"
          class="flex items-center justify-between border-t border-default p-2"
        >
          <UButton color="neutral" variant="ghost" size="sm" :label="filterUi.actions.clear" @click="clearFilter" />
          <UButton color="neutral" variant="subtle" size="sm" :label="filterUi.actions.apply" @click="applyFilter" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
