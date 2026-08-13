<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import UTree from '@nuxt/ui/components/Tree.vue'
import { computed, ref, watch } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormOptionValue } from '../../types'
import type { ResolvedFormOption } from '../../utils/options'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormHierarchyField } from './types'

interface FlatHierarchyOption extends ResolvedFormOption {
  pathLabel: string
  depth: number
  leaf: boolean
}

interface TreeHierarchyItem extends TreeItem {
  value: FormOptionValue
  pathLabel: string
  children?: TreeHierarchyItem[]
}

const props = defineProps<{
  field: FormHierarchyField
  path: readonly string[]
}>()

const { form, controlProps, controlSize, disabled, handleBlur, options, placeholder } =
  useFieldControl(
    () => props.field,
    () => props.path,
  )
const formUi = useFormUi()
const isTree = computed<boolean>(() => props.field.type === 'tree')
const isTreeSelect = computed<boolean>(() => props.field.type === 'tree-select')
const usesTree = computed<boolean>(() => isTree.value || isTreeSelect.value)
const treeMultiple = computed<boolean>(() => {
  const field = props.field
  if (field.type !== 'tree' && field.type !== 'tree-select') return field.multiple === true
  if (field.selectionControl === 'radio') return false
  return field.multiple === true
})
const treeSelectionControl = computed<'none' | 'radio' | 'checkbox'>(() => {
  const field = props.field
  if (field.type !== 'tree' && field.type !== 'tree-select') return 'none'
  if (field.selectionControl) return field.selectionControl
  return treeMultiple.value ? 'checkbox' : 'radio'
})
const treeSelectOpen = ref<boolean>(false)
const treeSearch = ref<string>('')
const separator = computed<string>(() =>
  props.field.type === 'cascader' ? (props.field.separator ?? ' / ') : ' / ',
)
const flatItems = computed<readonly FlatHierarchyOption[]>(() =>
  flattenOptions(options.items.value),
)
const selectableItems = computed<readonly FlatHierarchyOption[]>(() =>
  props.field.type === 'cascader' && props.field.leafOnly
    ? flatItems.value.filter((item) => item.leaf)
    : flatItems.value,
)
const selectItems = computed<FlatHierarchyOption[]>(() => [...selectableItems.value])
const treeItems = computed<TreeHierarchyItem[]>(() => toTreeItems(options.items.value))
const visibleTreeItems = computed<TreeHierarchyItem[]>(() =>
  filterTreeItems(treeItems.value, treeSearch.value),
)
const model = computed<FormOptionValue | FormOptionValue[] | null>({
  get: () => {
    const value = form.getValue(props.path)
    if (Array.isArray(value)) return value.filter(isOptionValue)
    return isOptionValue(value) ? value : null
  },
  set: (value) => form.setValue(props.path, value),
})
const treeModel = computed<TreeHierarchyItem | TreeHierarchyItem[] | undefined>(() => {
  const values = Array.isArray(model.value) ? model.value : [model.value]
  const selected = flattenTreeItems(treeItems.value).filter((item) => values.includes(item.value))
  if (usesTree.value ? treeMultiple.value : props.field.multiple) return selected
  return selected[0]
})
const selectedTreeItems = computed<readonly TreeHierarchyItem[]>(() => {
  const selected = treeModel.value
  if (!selected) return []
  return Array.isArray(selected) ? selected : [selected]
})
const treeSelectLabel = computed<string>(() => {
  if (!selectedTreeItems.value.length) return placeholder.value
  if (treeMultiple.value) return selectedTreeItems.value.map((item) => item.pathLabel).join(', ')
  const selected = selectedTreeItems.value[0]
  if (!selected) return placeholder.value
  return props.field.type === 'tree-select' && props.field.showPath
    ? selected.pathLabel
    : String(selected.label)
})

watch(treeSelectOpen, (open) => {
  if (!open) treeSearch.value = ''
})

function flattenOptions(
  items: readonly ResolvedFormOption[],
  labels: readonly string[] = [],
  depth = 0,
): readonly FlatHierarchyOption[] {
  return items.flatMap((item) => {
    const path = [...labels, item.label]
    const current: FlatHierarchyOption = {
      ...item,
      label: displayLabel(item, depth),
      pathLabel: path.join(separator.value),
      depth,
      leaf: !item.children?.length,
    }
    return [current, ...flattenOptions(item.children ?? [], path, depth + 1)]
  })
}

function displayLabel(item: ResolvedFormOption, depth: number) {
  const count =
    props.field.type === 'tree-select' && props.field.showChildrenCount
      ? ` (${item.children?.length ?? 0})`
      : ''
  if (props.field.type === 'cascader' || hasShowPath(props.field)) return item.label
  return `${'  '.repeat(depth)}${item.label}${count}`
}

function toTreeItems(
  items: readonly ResolvedFormOption[],
  labels: readonly string[] = [],
): TreeHierarchyItem[] {
  return items.map((item) => ({
    ...item,
    label: treeItemLabel(item),
    pathLabel: [...labels, item.label].join(separator.value),
    children: item.children ? toTreeItems(item.children, [...labels, item.label]) : undefined,
  }))
}

function treeItemLabel(item: ResolvedFormOption) {
  if (props.field.type !== 'tree-select' || !props.field.showChildrenCount) return item.label
  const count = item.children?.length ?? 0
  return count ? `${item.label} (${count})` : item.label
}

function filterTreeItems(items: readonly TreeHierarchyItem[], query: string): TreeHierarchyItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return [...items]
  return items.flatMap((item) => {
    const children = filterTreeItems(item.children ?? [], query)
    if (String(item.label).toLocaleLowerCase().includes(normalizedQuery)) return [{ ...item }]
    if (children.length) return [{ ...item, children }]
    return []
  })
}

function flattenTreeItems(items: readonly TreeHierarchyItem[]): readonly TreeHierarchyItem[] {
  return items.flatMap((item) => [item, ...flattenTreeItems(item.children ?? [])])
}

function updateTreeModel(value: TreeHierarchyItem | TreeHierarchyItem[] | undefined) {
  if (Array.isArray(value)) {
    form.setValue(
      props.path,
      value.map((item) => item.value),
    )
    return
  }
  form.setValue(props.path, value?.value ?? null)
  if (isTreeSelect.value) treeSelectOpen.value = false
}

function clearTreeSelection() {
  form.setValue(props.path, treeMultiple.value ? [] : null)
  treeSelectOpen.value = false
}

function treeKey(item: TreeHierarchyItem) {
  return String(item.value)
}

function hasShowPath(field: FormHierarchyField) {
  return field.type === 'tree-select' && field.showPath === true
}

function treePropagateSelect(field: FormHierarchyField) {
  return field.type === 'tree' || field.type === 'tree-select'
    ? (field.propagateSelect ?? field.cascade)
    : undefined
}

function treeBubbleSelect(field: FormHierarchyField) {
  return field.type === 'tree' || field.type === 'tree-select'
    ? (field.bubbleSelect ?? field.cascade)
    : undefined
}

function treeSelectionBehavior(field: FormHierarchyField) {
  if (field.type !== 'tree' && field.type !== 'tree-select') return undefined
  return field.selectionBehavior ?? (treeMultiple.value ? 'toggle' : 'replace')
}

function treeSelectionIcon(selected: boolean, indeterminate: boolean | undefined) {
  if (treeSelectionControl.value === 'radio')
    return selected ? 'i-lucide-circle-dot' : 'i-lucide-circle'
  if (indeterminate) return 'i-lucide-square-minus'
  return selected ? 'i-lucide-square-check-big' : 'i-lucide-square'
}

function treeVirtualize(field: FormHierarchyField) {
  return field.type === 'tree' ? field.virtualize : undefined
}

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UTree
      v-if="isTree"
      v-bind="controlProps"
      :model-value="treeModel"
      :items="treeItems"
      :get-key="treeKey"
      :multiple="treeMultiple"
      :selection-behavior="treeSelectionBehavior(field)"
      :propagate-select="treePropagateSelect(field)"
      :bubble-select="treeBubbleSelect(field)"
      :virtualize="treeVirtualize(field)"
      :disabled="disabled"
      :size="controlSize"
      :class="mergeFormUiClass('w-full py-1', formUi.ui.value.tree?.ui?.root)"
      :ui="{
        item: formUi.ui.value.tree?.ui?.item,
        itemWithChildren: formUi.ui.value.tree?.ui?.itemWithChildren,
        listWithChildren: formUi.ui.value.tree?.ui?.listWithChildren,
        link: formUi.ui.value.tree?.ui?.link,
        linkLeadingIcon: formUi.ui.value.tree?.ui?.linkLeadingIcon,
        linkLabel: formUi.ui.value.tree?.ui?.linkLabel,
        linkTrailing: formUi.ui.value.tree?.ui?.linkTrailing,
        linkTrailingIcon: formUi.ui.value.tree?.ui?.linkTrailingIcon,
      }"
      @update:model-value="updateTreeModel"
      @blur="handleBlur"
    >
      <template v-if="treeSelectionControl !== 'none'" #item-leading="{ selected, indeterminate }">
        <UIcon
          :name="treeSelectionIcon(selected, indeterminate)"
          aria-hidden="true"
          :class="
            mergeFormUiClass(
              'size-4 shrink-0 transition-colors',
              selected || indeterminate ? 'text-primary' : 'text-muted',
              formUi.ui.value.tree?.ui?.selectionControl,
            )
          "
        />
      </template>
    </UTree>
    <UPopover
      v-else-if="isTreeSelect"
      v-model:open="treeSelectOpen"
      :content="{ align: 'start', sideOffset: 6 }"
      :ui="{
        content: mergeFormUiClass(
          'w-(--reka-popper-anchor-width) min-w-72 p-0',
          formUi.ui.value.treeSelect?.ui?.content,
        ),
      }"
    >
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        :size="controlSize"
        :disabled="disabled"
        :loading="options.loading.value"
        :trailing-icon="treeSelectOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        :class="
          mergeFormUiClass(
            'w-full justify-between font-normal',
            formUi.ui.value.treeSelect?.ui?.trigger,
          )
        "
        :ui="{
          label: mergeFormUiClass(
            'min-w-0 flex-1 truncate text-left',
            formUi.ui.value.treeSelect?.ui?.triggerLabel,
          ),
        }"
        @blur="handleBlur"
      >
        {{ treeSelectLabel }}
      </UButton>

      <template #content>
        <div :class="mergeFormUiClass('grid min-w-0', formUi.ui.value.treeSelect?.ui?.root)">
          <div v-if="field.searchable !== false" class="border-b border-default p-2">
            <UInput
              v-model="treeSearch"
              icon="i-lucide-search"
              :size="controlSize"
              placeholder="Search"
              :class="mergeFormUiClass('w-full', formUi.ui.value.treeSelect?.ui?.search)"
              autofocus
            />
          </div>
          <UTree
            v-if="visibleTreeItems.length"
            :model-value="treeModel"
            :items="visibleTreeItems"
            :get-key="treeKey"
            :multiple="treeMultiple"
            :selection-behavior="treeSelectionBehavior(field)"
            :propagate-select="treePropagateSelect(field)"
            :bubble-select="treeBubbleSelect(field)"
            :disabled="disabled"
            :size="controlSize"
            :class="
              mergeFormUiClass('max-h-72 overflow-y-auto p-2', formUi.ui.value.treeSelect?.ui?.tree)
            "
            :ui="{
              item: formUi.ui.value.tree?.ui?.item,
              itemWithChildren: formUi.ui.value.tree?.ui?.itemWithChildren,
              listWithChildren: formUi.ui.value.tree?.ui?.listWithChildren,
              link: formUi.ui.value.tree?.ui?.link,
              linkLeadingIcon: formUi.ui.value.tree?.ui?.linkLeadingIcon,
              linkLabel: formUi.ui.value.tree?.ui?.linkLabel,
              linkTrailing: formUi.ui.value.tree?.ui?.linkTrailing,
              linkTrailingIcon: formUi.ui.value.tree?.ui?.linkTrailingIcon,
            }"
            @update:model-value="updateTreeModel"
          >
            <template
              v-if="treeSelectionControl !== 'none'"
              #item-leading="{ selected, indeterminate }"
            >
              <UIcon
                :name="treeSelectionIcon(selected, indeterminate)"
                aria-hidden="true"
                :class="
                  mergeFormUiClass(
                    'size-4 shrink-0 transition-colors',
                    selected || indeterminate ? 'text-primary' : 'text-muted',
                    formUi.ui.value.tree?.ui?.selectionControl,
                  )
                "
              />
            </template>
          </UTree>
          <p
            v-else
            :class="
              mergeFormUiClass(
                'px-3 py-8 text-center text-sm text-muted',
                formUi.ui.value.treeSelect?.ui?.empty,
              )
            "
          >
            No matching options
          </p>
          <div
            v-if="field.clearable && selectedTreeItems.length"
            class="flex justify-end border-t border-default p-2"
          >
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              label="Clear selection"
              @click="clearTreeSelection"
            />
          </div>
        </div>
      </template>
    </UPopover>
    <USelectMenu
      v-else
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :items="selectItems"
      value-key="value"
      :label-key="field.type === 'cascader' || hasShowPath(field) ? 'pathLabel' : 'label'"
      :multiple="field.multiple"
      :search-input="field.searchable ?? true"
      :clear="field.clearable === true"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="options.loading.value"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
