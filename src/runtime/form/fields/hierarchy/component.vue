<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import UTree from '@nuxt/ui/components/Tree.vue'
import type { TreeItem } from '@nuxt/ui/components/Tree.vue'
import { useScrollShadow } from '@nuxt/ui/composables/useScrollShadow'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormCompositeControl from '../../components/renderer/form-composite-control.vue'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormOptionMenuFooter from '../../components/utils/form-option-menu-footer.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue, FormOptionValue } from '../../types'
import { formOptionKey } from '../../utils/options'
import type { ResolvedFormOption } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import SelectionCheckbox from './selection-checkbox.vue'
import SelectionRadio from './selection-radio.vue'
import type {
  FormCascaderProps,
  FormHierarchyField,
  FormTreeProps,
  FormTreeSelectProps,
} from './types'
import { resolveHierarchySelection } from './utils'

interface FlatHierarchyOption extends ResolvedFormOption {
  pathLabel: string
  depth: number
  leaf: boolean
}

interface TreeHierarchyItem extends TreeItem {
  value: FormOptionValue
  pathLabel: string
  lazy?: boolean
  children?: TreeHierarchyItem[]
}

const props = defineProps<{
  field: FormHierarchyField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const {
  fieldProps: hierarchyProps,
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
  {
    omit: [
      'multiple',
      'searchable',
      'clearable',
      'childrenKey',
      'valueKey',
      'labelKey',
      'selectionControl',
      'selectionBehavior',
      'propagateSelect',
      'bubbleSelect',
      'cascade',
      'showPath',
      'showChildrenCount',
      'separator',
      'leafOnly',
      'virtualize',
    ],
  },
)
const formUi = useFormUi()
// SAFETY: the three hierarchy kinds share one component; unknown keys read as undefined and every kind-specific read is guarded by a type check.
const fieldProps = computed(
  () => hierarchyProps.value as Partial<FormTreeSelectProps & FormCascaderProps & FormTreeProps>,
)
const isTree = computed<boolean>(() => props.field.type === 'tree')
const isTreeSelect = computed<boolean>(() => props.field.type === 'tree-select')
const usesTree = computed<boolean>(() => isTree.value || isTreeSelect.value)
const treeMultiple = computed<boolean>(() => {
  const { field } = props
  if (field.type !== 'tree' && field.type !== 'tree-select') {
    return fieldProps.value.multiple === true
  }
  if (fieldProps.value.selectionControl === 'radio') {
    return false
  }
  return fieldProps.value.multiple === true
})
const treeSelectionControl = computed<'none' | 'radio' | 'checkbox'>(() => {
  const { field } = props
  if (field.type !== 'tree' && field.type !== 'tree-select') {
    return 'none'
  }
  if (fieldProps.value.selectionControl) {
    return fieldProps.value.selectionControl
  }
  return treeMultiple.value ? 'checkbox' : 'radio'
})
const treeSelectOpen = ref<boolean>(false)
const treeSearch = ref<string>('')
const expandedKeys = ref<string[]>([])
const separator = computed<string>(() =>
  props.field.type === 'cascader' ? (fieldProps.value.separator ?? ' / ') : ' / ',
)
const flatItems = computed<readonly FlatHierarchyOption[]>(() =>
  flattenOptions(options.items.value),
)
const selectableItems = computed<readonly FlatHierarchyOption[]>(() =>
  props.field.type === 'cascader' && fieldProps.value.leafOnly
    ? flatItems.value.filter((item) => item.leaf)
    : flatItems.value,
)
const selectItems = computed<FlatHierarchyOption[]>(() => [...selectableItems.value])
const treeItems = computed<TreeHierarchyItem[]>(() => toTreeItems(options.items.value))
const visibleTreeItems = computed<TreeHierarchyItem[]>(() =>
  options.remote.value ? treeItems.value : filterTreeItems(treeItems.value, treeSearch.value),
)
const loadingKeys = ref<string[]>([])
const treeListRef = ref<HTMLElement | null>(null)
const treeListShadow = useScrollShadow(treeListRef, { size: 16 })
const model = computed<FormOptionValue | FormOptionValue[] | null>({
  get: () => {
    const value = form.getValue(props.path)
    if (Array.isArray(value)) {
      return value.filter(isOptionValue)
    }
    return isOptionValue(value) ? value : null
  },
  set: (value) => form.setValue(props.path, value),
})
const treeModel = computed<TreeHierarchyItem | TreeHierarchyItem[] | undefined>(() => {
  const values = Array.isArray(model.value) ? model.value : [model.value]
  const selected = flattenTreeItems(treeItems.value).filter((item) => values.includes(item.value))
  if (usesTree.value ? treeMultiple.value : fieldProps.value.multiple) {
    return selected
  }
  return selected[0]
})
const selectedTreeItems = computed<readonly TreeHierarchyItem[]>(() => {
  const selected = treeModel.value
  if (!selected) {
    return []
  }
  return Array.isArray(selected) ? selected : [selected]
})
const treeSelectLabel = computed<string>(() => {
  if (!selectedTreeItems.value.length) {
    return placeholder.value
  }
  if (treeMultiple.value) {
    return selectedTreeItems.value.map((item) => item.pathLabel).join(', ')
  }
  const [selected] = selectedTreeItems.value
  if (!selected) {
    return placeholder.value
  }
  return props.field.type === 'tree-select' && fieldProps.value.showPath
    ? selected.pathLabel
    : String(selected.label)
})
const fieldLabel = computed<string | undefined>(() => resolveFormText(props.field.label))
const ownedControlUi = computed(() => ({
  ...controlProps.value.ui,
  content: mergeFormUiClass(controlProps.value.ui?.content, interactionOwnerClass.value),
}))

watch(treeSelectOpen, (open) => {
  if (open) {
    options.activate()
    return
  }
  treeSearch.value = ''
})
watch(treeSearch, (query) => {
  if (options.remote.value) {
    options.setSearch(query)
    return
  }
  if (!query.trim()) {
    return
  }
  expandedKeys.value = flattenTreeItems(visibleTreeItems.value)
    .filter((item) => item.children?.length)
    .map((item) => treeKey(item))
})

function isExpandable(item: TreeHierarchyItem) {
  return Boolean(item.children?.length) || item.lazy === true
}

function isLoadingItem(item: TreeHierarchyItem) {
  return loadingKeys.value.includes(treeKey(item))
}

async function toggleNode(item: TreeHierarchyItem) {
  const key = treeKey(item)
  if (expandedKeys.value.includes(key)) {
    expandedKeys.value = expandedKeys.value.filter((entry) => entry !== key)
    return
  }
  expandedKeys.value = [...expandedKeys.value, key]
  if (!item.lazy || item.children?.length || isLoadingItem(item)) {
    return
  }
  loadingKeys.value = [...loadingKeys.value, key]
  try {
    await options.loadChildren({ label: String(item.label), value: item.value })
  } finally {
    loadingKeys.value = loadingKeys.value.filter((entry) => entry !== key)
  }
}

function flattenOptions(
  items: readonly ResolvedFormOption[],
  labels: readonly string[] = [],
  depth = 0,
): readonly FlatHierarchyOption[] {
  return items.flatMap((item) => {
    const path = [...labels, item.label]
    const current: FlatHierarchyOption = {
      ...item,
      depth,
      label: displayLabel(item, depth),
      leaf: !item.children?.length,
      pathLabel: path.join(separator.value),
    }
    return [current, ...flattenOptions(item.children ?? [], path, depth + 1)]
  })
}

function displayLabel(item: ResolvedFormOption, depth: number) {
  const count =
    props.field.type === 'tree-select' && fieldProps.value.showChildrenCount
      ? ` (${item.children?.length ?? 0})`
      : ''
  if (props.field.type === 'cascader' || hasShowPath(props.field)) {
    return item.label
  }
  return `${'  '.repeat(depth)}${item.label}${count}`
}

function toTreeItems(
  items: readonly ResolvedFormOption[],
  labels: readonly string[] = [],
): TreeHierarchyItem[] {
  return items.map((item) => {
    const treeItem: TreeHierarchyItem = {
      ...item,
      children: item.children ? toTreeItems(item.children, [...labels, item.label]) : undefined,
      label: treeItemLabel(item),
      lazy: item.lazy,
      pathLabel: [...labels, item.label].join(separator.value),
    }
    if (treeSelectionControl.value !== 'none') {
      treeItem.onSelect = preventTreeSelection
    }
    return treeItem
  })
}

function preventTreeSelection(event: { preventDefault: () => void }) {
  event.preventDefault()
}

function treeItemLabel(item: ResolvedFormOption) {
  if (props.field.type !== 'tree-select' || !fieldProps.value.showChildrenCount) {
    return item.label
  }
  const count = item.children?.length ?? 0
  return count ? `${item.label} (${count})` : item.label
}

function filterTreeItems(items: readonly TreeHierarchyItem[], query: string): TreeHierarchyItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) {
    return [...items]
  }
  return items.flatMap((item) => {
    const children = filterTreeItems(item.children ?? [], query)
    if (String(item.label).toLocaleLowerCase().includes(normalizedQuery)) {
      return [{ ...item }]
    }
    if (children.length) {
      return [{ ...item, children }]
    }
    return []
  })
}

function flattenTreeItems(items: readonly TreeHierarchyItem[]): readonly TreeHierarchyItem[] {
  return items.flatMap((item) => [item, ...flattenTreeItems(item.children ?? [])])
}

function updateTreeModel(value: TreeHierarchyItem | TreeHierarchyItem[] | undefined) {
  if (Array.isArray(value)) {
    const selected = new Map<string, FormOptionValue>()
    for (const item of value) {
      selected.set(formOptionKey(item.value), item.value)
    }
    form.setValue(
      props.path,
      resolveHierarchySelection({
        bubble: treeBubbleSelect(props.field) === true,
        items: options.items.value,
        next: [...selected.values()],
        propagate: treePropagateSelect(props.field) === true,
      }),
    )
    return
  }
  form.setValue(props.path, value?.value ?? null)
  if (isTreeSelect.value) {
    treeSelectOpen.value = false
  }
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
  if (selected.has(key)) {
    selected.delete(key)
  } else {
    selected.set(key, item.value)
  }
  form.setValue(
    props.path,
    resolveHierarchySelection({
      bubble: treeBubbleSelect(props.field) === true,
      intent: item.value,
      items: options.items.value,
      next: [...selected.values()],
      propagate: treePropagateSelect(props.field) === true,
    }),
  )
}

function selectRadioTreeItem(item: TreeHierarchyItem) {
  form.setValue(props.path, item.value)
  if (isTreeSelect.value) {
    treeSelectOpen.value = false
  }
}

function selectTreeRow(item: TreeHierarchyItem) {
  if (treeSelectionControl.value === 'checkbox') {
    toggleTreeItem(item)
    return
  }
  if (treeSelectionControl.value === 'radio') {
    selectRadioTreeItem(item)
  }
}

function hasShowPath(field: FormHierarchyField) {
  return field.type === 'tree-select' && fieldProps.value.showPath === true
}

function treePropagateSelect(field: FormHierarchyField) {
  return field.type === 'tree' || field.type === 'tree-select'
    ? (fieldProps.value.propagateSelect ?? fieldProps.value.cascade)
    : undefined
}

function treeBubbleSelect(field: FormHierarchyField) {
  return field.type === 'tree' || field.type === 'tree-select'
    ? (fieldProps.value.bubbleSelect ?? fieldProps.value.cascade)
    : undefined
}

function treeSelectionBehavior(field: FormHierarchyField) {
  if (field.type !== 'tree' && field.type !== 'tree-select') {
    return
  }
  return fieldProps.value.selectionBehavior ?? (treeMultiple.value ? 'toggle' : 'replace')
}

function treeVirtualize(field: FormHierarchyField) {
  return field.type === 'tree' ? fieldProps.value.virtualize : undefined
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
          #item-wrapper="{ item, selected, expanded, indeterminate, ui }"
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
              v-if="isExpandable(item)"
              type="button"
              :aria-label="String(item.label)"
              :aria-expanded="expanded ? 'true' : 'false'"
              data-form-tree-toggle
              class="ms-auto inline-flex rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
              @click.stop="toggleNode(item)"
            >
              <UIcon
                :name="isLoadingItem(item) ? 'i-lucide-loader-circle' : 'i-lucide-chevron-down'"
                aria-hidden="true"
                :class="[
                  ui.linkTrailingIcon(),
                  isLoadingItem(item) ? 'animate-spin' : '',
                  expanded && !isLoadingItem(item) ? 'rotate-180' : '',
                ]"
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
          <div
            :class="mergeFormUiClass('grid min-w-0', formUi.ui.value.treeSelect?.ui?.root)"
            data-form-tree-scope
          >
            <div v-if="fieldProps.searchable !== false" class="border-b border-default p-2">
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
              ref="treeListRef"
              :style="treeListShadow.style.value"
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
                #item-wrapper="{ item, selected, expanded, indeterminate, ui }"
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
                    v-if="isExpandable(item)"
                    type="button"
                    :aria-label="String(item.label)"
                    :aria-expanded="expanded ? 'true' : 'false'"
                    data-form-tree-toggle
                    class="ms-auto inline-flex rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
                    @click.stop="toggleNode(item)"
                  >
                    <UIcon
                      :name="
                        isLoadingItem(item) ? 'i-lucide-loader-circle' : 'i-lucide-chevron-down'
                      "
                      aria-hidden="true"
                      :class="[
                        ui.linkTrailingIcon(),
                        isLoadingItem(item) ? 'animate-spin' : '',
                        expanded && !isLoadingItem(item) ? 'rotate-180' : '',
                      ]"
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
              {{
                options.pending.value
                  ? t('form.fields.options.loadingMore')
                  : t('form.fields.hierarchy.empty')
              }}
            </p>
            <FormOptionMenuFooter :options="options" :disabled="disabled" />
            <div
              v-if="fieldProps.clearable && selectedTreeItems.length"
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
        :multiple="fieldProps.multiple"
        :search-input="fieldProps.searchable ?? true"
        :clear="fieldProps.clearable === true"
        :placeholder="placeholder"
        :disabled="disabled"
        :loading="validationPending || options.loading.value"
        :ui="ownedControlUi"
        @blur="handleBlur"
      />
    </FormCompositeControl>
  </FormFieldShell>
</template>
