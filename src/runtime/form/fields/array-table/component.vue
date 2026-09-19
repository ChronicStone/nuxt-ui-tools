<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { useScrollShadow } from '@nuxt/ui/composables/useScrollShadow'
import { computed, defineAsyncComponent, ref } from 'vue'

import FormFieldError from '../../components/renderer/form-field-error.vue'
import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import type { FormField, FormObject } from '../../types'
import { isNumber } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import { useFormArrayItems } from '../array-list/use-array-items'
import type { FormArrayTableField } from './types'

const props = defineProps<{
  field: FormArrayTableField
  path: readonly string[]
}>()

const VueDraggable = defineAsyncComponent(async () => {
  const { VueDraggable: draggableComponent } = await import('vue-draggable-plus')
  return draggableComponent
})

const {
  addItem,
  addItemLabel,
  canAdd,
  canDelete,
  customActionVisible,
  emptyLabel,
  formUi,
  hasCustomActions,
  isDraggable,
  itemPath,
  itemRenderKey,
  items,
  removeItem,
  runCustomAction,
  t,
  updateItems,
} = useFormArrayItems(
  () => props.field,
  () => props.path,
)
const viewportRef = ref<HTMLElement | null>(null)
const viewportShadow = useScrollShadow(viewportRef, { orientation: 'horizontal', size: 20 })
const ui = computed(() => formUi.ui.value.arrayTable?.ui)
const columns = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const minWidth = computed(() =>
  isNumber(props.field.minWidth) ? `${props.field.minWidth}px` : props.field.minWidth,
)
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateItems,
})
const showActionsColumn = computed<boolean>(() =>
  items.value.some(
    (_item, index) => isDraggable.value || canDelete(index) || hasCustomActions(index),
  ),
)

function fieldLabel(field: FormField) {
  return 'label' in field ? (resolveFormText(field.label) ?? field.key) : field.key
}
</script>

<template>
  <section :class="mergeFormUiClass('grid gap-3', ui?.root)">
    <div
      ref="viewportRef"
      :class="
        mergeFormUiClass(
          'w-full overflow-x-auto rounded-lg border border-default bg-default',
          ui?.viewport,
        )
      "
      :style="viewportShadow.style.value"
    >
      <table
        :class="mergeFormUiClass('w-full table-fixed border-collapse text-sm', ui?.table)"
        :style="{ minWidth }"
      >
        <thead :class="mergeFormUiClass('bg-elevated/70 text-left text-muted', ui?.head)">
          <tr :class="ui?.headerRow">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="
                mergeFormUiClass(
                  'border-b border-r border-default px-3 py-2.5 font-medium last:border-r-0',
                  ui?.headerCell,
                )
              "
            >
              {{ fieldLabel(column) }}
            </th>
            <th
              v-if="showActionsColumn"
              scope="col"
              :class="mergeFormUiClass('w-36 border-b border-default px-2 py-2', ui?.actionsHeader)"
            />
          </tr>
        </thead>
        <component
          :is="isDraggable ? VueDraggable : 'tbody'"
          v-model="dragItems"
          :tag="isDraggable ? 'tbody' : undefined"
          :class="ui?.body"
          handle=".array-table-drag-handle"
          :animation="150"
        >
          <tr
            v-for="(item, index) in items"
            :key="itemRenderKey(item, index)"
            :class="
              mergeFormUiClass(
                'align-middle transition-colors hover:bg-elevated/35 [&>*]:border-b [&>*]:border-default [&:last-child>*]:border-b-0',
                ui?.row,
              )
            "
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="
                mergeFormUiClass('border-r border-default px-3 py-2 last:border-r-0', ui?.cell)
              "
            >
              <div :class="mergeFormUiClass('flex min-h-9 w-full items-center', ui?.control)">
                <FormFieldRenderer :field="column" :parent-path="itemPath(index)" bare />
              </div>
              <FormFieldError
                :path="[...itemPath(index), column.key]"
                :class="mergeFormUiClass('mt-1 text-xs text-error', ui?.error)"
              />
            </td>
            <td
              v-if="showActionsColumn"
              :class="mergeFormUiClass('whitespace-nowrap px-2 py-2 text-right', ui?.actionsCell)"
            >
              <UButton
                v-if="isDraggable"
                icon="i-lucide-grip-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="
                  mergeFormUiClass(
                    'array-table-drag-handle cursor-grab active:cursor-grabbing',
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
                {{ resolveFormText(action.label) }}
              </UButton>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td
              :colspan="columns.length + (showActionsColumn ? 1 : 0)"
              :class="mergeFormUiClass('px-3 py-10 text-center text-muted', ui?.empty)"
            >
              {{ emptyLabel }}
            </td>
          </tr>
        </component>
      </table>
    </div>
    <UButton
      v-if="canAdd"
      icon="i-lucide-plus"
      variant="soft"
      :size="formUi.controlSize.value"
      :class="mergeFormUiClass('justify-self-start', ui?.add)"
      @click="addItem()"
    >
      {{ addItemLabel }}
    </UButton>
  </section>
</template>
