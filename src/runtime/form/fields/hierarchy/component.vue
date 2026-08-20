<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import UTree from '@nuxt/ui/components/Tree.vue'
import type { TreeItem } from '@nuxt/ui/components/Tree.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormCompositeControl from '../../components/renderer/FormCompositeControl.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue } from '../../types'
import type { FormOptionValue } from '../../types'
import { formOptionKey, type ResolvedFormOption } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import SelectionCheckbox from './SelectionCheckbox.vue'
import SelectionRadio from './SelectionRadio.vue'
import type { FormHierarchyField } from './types'
import { resolveHierarchySelection } from './utils'

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
const { t } = useUiToolsLocale()

const {
  form,
  controlProps,
  controlSize,
  disabled,
  handleBlur,
  interactionOwnerClass,
  options,
  placeholder,
  validationPending,
} = useFieldControl(
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
const expandedKeys = ref<string[]>([])
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
const fieldLabel = computed<string | undefined>(() => resolveFormText(props.field.label))
const ownedControlUi = computed(() => ({
  ...controlProps.value.ui,
  content: mergeFormUiClass(controlProps.value.ui?.content, interactionOwnerClass.value),
}))

watch(treeSelectOpen, (open) => {
  if (!open) treeSearch.value = ''
})
watch(treeSearch, (query) => {
  if (!query.trim()) return
  expandedKeys.value = flattenTreeItems(visibleTreeItems.value)
    .filter((item) => item.children?.length)
    .map((item) => treeKey(item))
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
  return items.map((item) => {
    const treeItem: TreeHierarchyItem = {
      ...item,
      label: treeItemLabel(item),
      pathLabel: [...labels, item.label].join(separator.value),
      children: item.children ? toTreeItems(item.children, [...labels, item.label]) : undefined,
    }
    if (treeSelectionControl.value !== 'none') treeItem.onSelect = preventTreeSelection
    return treeItem
  })
}

function preventTreeSelection(event: { preventDefault: () => void }) {
  event.preventDefault()
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
    const selected = new Map<string, FormOptionValue>()
    for (const item of value) selected.set(formOptionKey(item.value), item.value)
    form.setValue(
      props.path,
      resolveHierarchySelection({
        next: [...selected.values()],
        items: options.items.value,
        propagate: treePropagateSelect(props.field) === true,
        bubble: treeBubbleSelect(props.field) === true,
      }),
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
  return formOptionKey(item.value)
}

function toggleTreeItem(item: TreeHierarchyItem) {
  const current = Array.isArray(model.value) ? model.value : []
  const selected = new Map(current.map((value) => [formOptionKey(value), value]))
  const key = formOptionKey(item.value)
  if (selected.has(key)) selected.delete(key)
  else selected.set(key, item.value)
  form.setValue(
    props.path,
    resolveHierarchySelection({
      next: [...selected.values()],
      intent: item.value,
      items: options.items.value,
      propagate: treePropagateSelect(props.field) === true,
      bubble: treeBubbleSelect(props.field) === true,
    }),
  )
}

function selectRadioTreeItem(item: TreeHierarchyItem) {
  form.setValue(props.path, item.value)
  if (isTreeSelect.value) treeSelectOpen.value = false
}

function selectTreeRow(item: TreeHierarchyItem) {
  if (treeSelectionControl.value === 'checkbox') {
    toggleTreeItem(item)
    return
  }
  if (treeSelectionControl.value === 'radio') selectRadioTreeItem(item)
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

function treeVirtualize(field: FormHierarchyField) {
  return field.type === 'tree' ? field.virtualize : undefined
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <FormCompositeControl v-slot="{ attrs }">
      <UTree
        v-if="isTree"
        v-bind="{ ...controlProps, ...attrs }"
        :aria-label="fieldLabel"
        :model-value="treeModel"
        v-model:expanded="expandedKeys"
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
        <template
          v-if="treeSelectionControl !== 'none'"
          #item-wrapper="{ item, selected, expanded, indeterminate, handleToggle, ui }"
        >
          <div
            :class="ui.link({ selected, disabled: disabled || item.disabled })"
            :data-selected="selected ? '' : undefined"
            @click="selectTreeRow(item)"
          >
            <SelectionCheckbox
              v-if="treeSelectionControl === 'checkbox'"
              :model-value="indeterminate ? 'indeterminate' : selected"
              :label="String(item.label)"
              :disabled="disabled || item.disabled"
              :control-class="formUi.ui.value.tree?.ui?.selectionControl"
              @click.stop
              @update:model-value="toggleTreeItem(item)"
            />
            <SelectionRadio
              v-else
              :value="treeKey(item)"
              :label="String(item.label)"
              :selected="selected"
              :disabled="disabled || item.disabled"
              :control-class="formUi.ui.value.tree?.ui?.selectionControl"
              @click.stop
              @select="selectRadioTreeItem(item)"
            />
            <span :class="ui.linkLabel()">{{ item.label }}</span>
            <button
              v-if="item.children?.length"
              type="button"
              :aria-label="String(item.label)"
              class="ms-auto inline-flex rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
              @click.stop="handleToggle"
            >
              <UIcon
                name="i-lucide-chevron-down"
                aria-hidden="true"
                :class="[ui.linkTrailingIcon(), expanded ? 'rotate-180' : '']"
              />
            </button>
          </div>
        </template>
      </UTree>
      <UPopover
        v-else-if="isTreeSelect"
        v-model:open="treeSelectOpen"
        :content="{ align: 'start', sideOffset: 6 }"
        :ui="{
          content: mergeFormUiClass(
            'w-(--reka-popper-anchor-width) min-w-72 p-0',
            interactionOwnerClass,
            formUi.ui.value.treeSelect?.ui?.content,
          ),
        }"
      >
        <UButton
          v-bind="attrs"
          type="button"
          color="neutral"
          variant="outline"
          :size="controlSize"
          :disabled="disabled"
          :loading="validationPending || options.loading.value"
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
                :placeholder="t('form.fields.hierarchy.search')"
                :class="mergeFormUiClass('w-full', formUi.ui.value.treeSelect?.ui?.search)"
                autofocus
              />
            </div>
            <UTree
              v-if="visibleTreeItems.length"
              :model-value="treeModel"
              v-model:expanded="expandedKeys"
              :items="visibleTreeItems"
              :get-key="treeKey"
              :multiple="treeMultiple"
              :selection-behavior="treeSelectionBehavior(field)"
              :propagate-select="treeSearch ? false : treePropagateSelect(field)"
              :bubble-select="treeSearch ? false : treeBubbleSelect(field)"
              :disabled="disabled"
              :size="controlSize"
              :class="
                mergeFormUiClass(
                  'max-h-72 overflow-y-auto p-2',
                  formUi.ui.value.treeSelect?.ui?.tree,
                )
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
                #item-wrapper="{ item, selected, expanded, indeterminate, handleToggle, ui }"
              >
                <div
                  :class="ui.link({ selected, disabled: disabled || item.disabled })"
                  :data-selected="selected ? '' : undefined"
                  @click="selectTreeRow(item)"
                >
                  <SelectionCheckbox
                    v-if="treeSelectionControl === 'checkbox'"
                    :model-value="indeterminate ? 'indeterminate' : selected"
                    :label="String(item.label)"
                    :disabled="disabled || item.disabled"
                    :control-class="formUi.ui.value.tree?.ui?.selectionControl"
                    @click.stop
                    @update:model-value="toggleTreeItem(item)"
                  />
                  <SelectionRadio
                    v-else
                    :value="treeKey(item)"
                    :label="String(item.label)"
                    :selected="selected"
                    :disabled="disabled || item.disabled"
                    :control-class="formUi.ui.value.tree?.ui?.selectionControl"
                    @click.stop
                    @select="selectRadioTreeItem(item)"
                  />
                  <span :class="ui.linkLabel()">{{ item.label }}</span>
                  <button
                    v-if="item.children?.length"
                    type="button"
                    :aria-label="String(item.label)"
                    class="ms-auto inline-flex rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
                    @click.stop="handleToggle"
                  >
                    <UIcon
                      name="i-lucide-chevron-down"
                      aria-hidden="true"
                      :class="[ui.linkTrailingIcon(), expanded ? 'rotate-180' : '']"
                    />
                  </button>
                </div>
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
              {{ t('form.fields.hierarchy.empty') }}
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
                :label="t('form.fields.hierarchy.clear')"
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
        :loading="validationPending || options.loading.value"
        :ui="ownedControlUi"
        @blur="handleBlur"
      />
    </FormCompositeControl>
  </FormFieldShell>
</template>
