<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, defineAsyncComponent, ref, useId } from 'vue'

import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import FormFieldStatus from '../../components/renderer/form-field-status.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import type { FormObject } from '../../types'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import { useFormArrayItems } from '../array-list/use-array-items'
import type { FormArrayCollapseField } from './types'

const props = defineProps<{
  field: FormArrayCollapseField
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
  actionParams,
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
  itemPath,
  itemRenderKey,
  items,
  runCustomAction,
  t,
  title,
  updateItems,
} = array
const baseId = useId()
const ui = computed(() => formUi.ui.value.arrayCollapse?.ui)
const containerLayout = useFormContainerLayout({
  formLayout: form.currentLayout,
  layout: () => props.field.layout,
})
const expanded = ref<readonly number[]>(initialExpanded())
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateDraggedItems,
})
const arrowLeft = computed(() => props.field.arrowPlacement !== 'right')

function initialExpanded() {
  if (props.field.defaultExpanded === 'all') {
    return items.value.map((_item, index) => index)
  }
  if (props.field.defaultExpanded === 'first' && items.value.length > 0) {
    return [0]
  }
  return []
}

function isExpanded(index: number) {
  return expanded.value.includes(index)
}

function expand(index: number) {
  if (isExpanded(index)) {
    return
  }
  expanded.value = props.field.accordion ? [index] : [...expanded.value, index]
}

function toggle(index: number) {
  if (isExpanded(index)) {
    expanded.value = expanded.value.filter((candidate) => candidate !== index)
    return
  }
  expand(index)
}

function addItem() {
  expand(array.addItem())
}

function removeItem(index: number) {
  if (!array.removeItem(index)) {
    return
  }
  expanded.value = expanded.value
    .filter((candidate) => candidate !== index)
    .map((candidate) => (candidate > index ? candidate - 1 : candidate))
}

function updateDraggedItems(value: readonly FormObject[]) {
  const previousIndexes = value.map((item) => items.value.indexOf(item))
  updateItems(value)
  expanded.value = expanded.value
    .map((candidate) => previousIndexes.indexOf(candidate))
    .filter((candidate) => candidate !== -1)
}

function summary(item: FormObject, index: number) {
  return resolveFormText(props.field.summaryTemplate?.(item, index, actionParams(index).deps))
}

function bodyId(index: number) {
  return `${baseId}-${index}`
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

    <component
      :is="isDraggable ? VueDraggable : 'div'"
      v-else
      v-model="dragItems"
      :class="
        mergeFormUiClass(
          'overflow-hidden rounded-lg border border-default bg-default divide-y divide-default',
          ui?.list,
        )
      "
      handle=".array-collapse-drag-handle"
      :animation="150"
    >
      <FormFieldStatus
        v-for="(item, index) in items"
        :key="itemRenderKey(item, index)"
        v-slot="{ invalid }"
        :path="itemPath(index)"
        @invalid="expand(index)"
      >
        <div
          :class="mergeFormUiClass('grid', ui?.item)"
          :data-form-array-item="index"
          :data-expanded="isExpanded(index) ? 'true' : 'false'"
        >
          <div
            :class="
              mergeFormUiClass(
                [
                  'flex items-center gap-2 pr-2 transition-colors',
                  isExpanded(index) ? 'bg-elevated/50' : 'hover:bg-elevated/35',
                ].join(' '),
                ui?.itemHeader,
              )
            "
          >
            <button
              type="button"
              :aria-expanded="isExpanded(index)"
              :aria-controls="bodyId(index)"
              :class="
                mergeFormUiClass(
                  [
                    'flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm font-medium',
                    arrowLeft ? '' : 'flex-row-reverse justify-between',
                    invalid ? 'text-error' : 'text-highlighted',
                  ].join(' '),
                  ui?.trigger,
                )
              "
              @click="toggle(index)"
            >
              <UIcon
                name="i-lucide-chevron-right"
                aria-hidden="true"
                :class="
                  mergeFormUiClass(
                    [
                      'size-4 shrink-0 text-dimmed transition-transform duration-200',
                      isExpanded(index) ? 'rotate-90 text-primary' : '',
                    ].join(' '),
                    ui?.arrow,
                  )
                "
              />
              <span
                :class="mergeFormUiClass('min-w-0 truncate', ui?.itemTitle)"
                :data-form-array-heading="index"
              >
                {{ itemHeading(item, index) }}
              </span>
            </button>
            <span
              v-if="summary(item, index)"
              :class="mergeFormUiClass('shrink-0 text-xs text-muted', ui?.summary)"
              :data-form-array-summary="index"
            >
              {{ summary(item, index) }}
            </span>
            <div :class="mergeFormUiClass('flex shrink-0 items-center gap-1', ui?.itemActions)">
              <UButton
                v-if="isDraggable"
                icon="i-lucide-grip-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="
                  mergeFormUiClass(
                    'array-collapse-drag-handle cursor-grab active:cursor-grabbing',
                    ui?.action,
                  )
                "
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
                {{ action.icon ? undefined : resolveFormText(action.label) }}
              </UButton>
            </div>
          </div>

          <div
            :id="bodyId(index)"
            class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
            :style="{ gridTemplateRows: isExpanded(index) ? '1fr' : '0fr' }"
            :aria-hidden="!isExpanded(index)"
            :data-form-array-body="index"
          >
            <div class="min-h-0 overflow-hidden">
              <div
                :class="[
                  mergeFormUiClass('grid border-t border-default', ui?.body),
                  field.compact ? 'gap-3 p-3' : 'gap-4 p-4',
                ]"
              >
                <div
                  :class="mergeFormUiClass('grid', ui?.fields)"
                  :style="containerLayout.style.value"
                >
                  <FormFieldRenderer
                    v-for="child in fieldsForItem(item)"
                    :key="child.key"
                    :field="child"
                    :parent-path="itemPath(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormFieldStatus>
    </component>

    <UButton
      v-if="canAdd"
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
