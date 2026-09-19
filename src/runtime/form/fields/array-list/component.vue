<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import FormFieldStatus from '../../components/renderer/form-field-status.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import type { FormArrayListField, FormArrayTabsField, FormArrayVariantField } from '../../types'
import type { FormObject } from '../../types/utils'
import { invokeFormFunction } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import { useFormArrayItems } from './use-array-items'

const props = defineProps<{
  field: FormArrayListField | FormArrayTabsField | FormArrayVariantField
  path: readonly string[]
}>()

const VueDraggable = defineAsyncComponent(async () => {
  const { VueDraggable: draggableComponent } = await import('vue-draggable-plus')
  return draggableComponent
})

const array = useFormArrayItems(
  () => props.field,
  () => props.path,
)
const {
  addItemLabel,
  canAdd,
  canDelete,
  customActionVisible,
  description,
  emptyLabel,
  fieldsForItem,
  form,
  formUi,
  isDraggable,
  itemHeading,
  itemLabel,
  itemPath,
  itemRenderKey,
  items,
  runCustomAction,
  t,
  title,
  updateItems,
  updateVariant,
  variantItems,
  variantValue,
} = array
const activeIndex = ref<number>(0)
const tabTransitionDirection = ref<'forward' | 'backward'>('forward')
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateDraggedItems,
})
const containerLayout = useFormContainerLayout({
  formLayout: form.currentLayout,
  layout: () => props.field.layout,
})
const isTabsMode = computed(
  () =>
    props.field.type === 'array-tabs' ||
    (props.field.type === 'array-variant' && props.field.displayMode === 'tabs'),
)
const ui = computed(() => formUi.ui.value.arrayList?.ui)

watch(items, (value) => {
  if (activeIndex.value >= value.length) {
    activeIndex.value = Math.max(0, value.length - 1)
  }
})

function addItem() {
  tabTransitionDirection.value = 'forward'
  activeIndex.value = array.addItem()
}

function removeItem(index: number) {
  const currentActiveIndex = activeIndex.value
  const hasNextItem = index + 1 < items.value.length
  if (currentActiveIndex === index) {
    tabTransitionDirection.value = hasNextItem ? 'forward' : 'backward'
  }
  if (!array.removeItem(index)) {
    return
  }
  if (currentActiveIndex < index) {
    return
  }
  if (currentActiveIndex > index) {
    activeIndex.value = currentActiveIndex - 1
    return
  }
  activeIndex.value = hasNextItem ? index : Math.max(0, index - 1)
}

function selectTab(index: number) {
  if (index === activeIndex.value) {
    return
  }
  tabTransitionDirection.value = index > activeIndex.value ? 'forward' : 'backward'
  activeIndex.value = index
}

function tabActionRenderer(item: FormObject, index: number) {
  if (props.field.type !== 'array-tabs' || !props.field.tabAction) {
    return null
  }
  const content = props.field.tabAction(item, index, {
    ...array.actionParams(index),
    setActiveTab: selectTab,
  })
  if (content === undefined || content === null) {
    return null
  }
  return () => invokeFormFunction(content) ?? content
}

function updateDraggedItems(value: readonly FormObject[]) {
  const activeItem = items.value[activeIndex.value]
  updateItems(value)
  if (!activeItem) {
    return
  }
  const nextActiveIndex = value.indexOf(activeItem)
  if (nextActiveIndex !== -1) {
    activeIndex.value = nextActiveIndex
  }
}
</script>

<template>
  <section :class="mergeFormUiClass('grid gap-3', ui?.root)">
    <div v-if="title || description" :class="mergeFormUiClass('grid gap-1', ui?.header)">
      <h3 v-if="title" :class="mergeFormUiClass('text-sm font-medium text-highlighted', ui?.title)">
        {{ title }}
      </h3>
      <p v-if="description" :class="mergeFormUiClass('text-sm text-muted', ui?.description)">
        {{ description }}
      </p>
    </div>

    <div
      v-if="items.length === 0"
      :class="
        mergeFormUiClass(
          'rounded-lg border border-dashed border-default bg-elevated/35 p-5 text-center text-sm text-muted',
          ui?.empty,
        )
      "
    >
      {{ emptyLabel }}
    </div>

    <div
      v-else-if="isTabsMode"
      :class="
        mergeFormUiClass('overflow-hidden rounded-lg border border-default bg-default', ui?.item)
      "
    >
      <div class="flex min-w-0 items-stretch border-b border-default bg-elevated/25">
        <VueDraggable
          v-model="dragItems"
          tag="div"
          role="tablist"
          :aria-label="title ?? itemLabel"
          :disabled="!isDraggable"
          handle=".array-tab-drag-handle"
          :animation="150"
          :class="mergeFormUiClass('flex min-w-0 flex-1 items-stretch overflow-x-auto', ui?.tabs)"
        >
          <FormFieldStatus
            v-for="(item, index) in items"
            :key="itemRenderKey(item, index)"
            v-slot="{ invalid }"
            :path="itemPath(index)"
          >
            <div
              :class="
                mergeFormUiClass(
                  [
                    'relative flex min-h-11 shrink-0 items-stretch transition-colors',
                    activeIndex === index
                      ? 'bg-default text-highlighted'
                      : 'text-muted hover:bg-elevated/60 hover:text-default',
                  ].join(' '),
                  ui?.tab,
                )
              "
            >
              <button
                type="button"
                role="tab"
                :aria-selected="activeIndex === index"
                class="array-tab-drag-handle flex min-w-0 items-center gap-2 px-3 py-2.5 text-sm font-medium"
                :class="[
                  isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                  invalid ? 'text-error' : '',
                ]"
                @click="selectTab(index)"
              >
                <UIcon
                  v-if="isDraggable"
                  name="i-lucide-grip-vertical"
                  class="size-3.5 shrink-0 text-dimmed"
                  aria-hidden="true"
                />
                <span class="max-w-48 truncate">{{ itemHeading(item, index) }}</span>
              </button>

              <div class="flex items-center gap-0.5 pr-1">
                <component
                  :is="tabActionRenderer(item, index)"
                  v-if="activeIndex === index && tabActionRenderer(item, index)"
                  data-form-array-tab-action=""
                />
                <UButton
                  v-for="(action, actionIndex) in field.actions?.custom ?? []"
                  v-show="customActionVisible(index, actionIndex)"
                  :key="actionIndex"
                  type="button"
                  :icon="action.icon"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :class="ui?.action"
                  @click.stop="runCustomAction(index, actionIndex)"
                >
                  {{ action.icon ? undefined : resolveFormText(action.label) }}
                </UButton>
                <UButton
                  v-if="canDelete(index)"
                  type="button"
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :class="ui?.action"
                  :aria-label="t('form.fields.array.removeItem')"
                  @click.stop="removeItem(index)"
                />
              </div>

              <span
                class="absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity"
                :class="activeIndex === index ? 'bg-primary opacity-100' : 'opacity-0'"
                aria-hidden="true"
              />
            </div>
          </FormFieldStatus>
        </VueDraggable>
        <div v-if="canAdd" class="flex shrink-0 items-center border-l border-default px-1.5">
          <UButton
            type="button"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            :size="formUi.controlSize.value"
            :aria-label="addItemLabel"
            :title="addItemLabel"
            @click="addItem"
          />
        </div>
      </div>

      <div :class="field.compact ? 'grid gap-3 p-3' : 'grid gap-4 p-4'">
        <USelect
          v-if="field.type === 'array-variant'"
          :model-value="variantValue(items[activeIndex])"
          :items="variantItems"
          value-key="value"
          :size="formUi.controlSize.value"
          :class="mergeFormUiClass('w-full max-w-xs', ui?.variant)"
          @update:model-value="updateVariant(activeIndex, $event)"
        />

        <div
          :class="mergeFormUiClass('grid', ui?.fields)"
          :style="containerLayout.style.value"
          :data-form-array-panel="activeIndex"
        >
          <FormFieldRenderer
            v-for="child in fieldsForItem(items[activeIndex] ?? {})"
            :key="child.key"
            :field="child"
            :parent-path="itemPath(activeIndex)"
          />
        </div>
      </div>
    </div>

    <component
      :is="isDraggable ? VueDraggable : 'div'"
      v-else
      v-model="dragItems"
      :class="mergeFormUiClass('grid gap-3', ui?.list)"
      handle=".array-drag-handle"
      :animation="150"
    >
      <div
        v-for="(item, index) in items"
        :key="itemRenderKey(item, index)"
        :class="[
          mergeFormUiClass('grid rounded-lg border border-default bg-default', ui?.item),
          field.compact ? 'gap-3 p-3' : 'gap-4 p-4',
        ]"
      >
        <div :class="mergeFormUiClass('flex items-center justify-between gap-3', ui?.itemHeader)">
          <span
            :class="mergeFormUiClass('text-sm font-medium text-highlighted', ui?.itemTitle)"
            :data-form-array-heading="index"
          >
            {{ itemHeading(items[index] ?? {}, index) }}
          </span>
          <div :class="mergeFormUiClass('flex items-center gap-1', ui?.itemActions)">
            <UButton
              v-if="isDraggable"
              icon="i-lucide-grip-vertical"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="mergeFormUiClass('array-drag-handle cursor-grab', ui?.action)"
              :aria-label="t('form.fields.array.dragItem')"
            />
            <UButton
              v-if="canDelete(index)"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="ui?.action"
              :aria-label="t('form.fields.array.removeItem')"
              @click="removeItem(index)"
            />
            <UButton
              v-for="(action, actionIndex) in field.actions?.custom ?? []"
              v-show="customActionVisible(index, actionIndex)"
              :key="actionIndex"
              :icon="action.icon"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="ui?.action"
              @click="runCustomAction(index, actionIndex)"
            >
              {{ resolveFormText(action.label) }}
            </UButton>
          </div>
        </div>

        <USelect
          v-if="field.type === 'array-variant'"
          :model-value="variantValue(items[index])"
          :items="variantItems"
          value-key="value"
          :size="formUi.controlSize.value"
          :class="mergeFormUiClass('w-full max-w-xs', ui?.variant)"
          @update:model-value="updateVariant(index, $event)"
        />

        <div :class="mergeFormUiClass('grid', ui?.fields)" :style="containerLayout.style.value">
          <FormFieldRenderer
            v-for="child in fieldsForItem(items[index] ?? {})"
            :key="child.key"
            :field="child"
            :parent-path="itemPath(index)"
          />
        </div>
      </div>
    </component>

    <UButton
      v-if="canAdd && (!isTabsMode || items.length === 0)"
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      :size="formUi.controlSize.value"
      :class="mergeFormUiClass('justify-self-start', ui?.add)"
      @click="addItem"
    >
      {{ addItemLabel }}
    </UButton>
  </section>
</template>
