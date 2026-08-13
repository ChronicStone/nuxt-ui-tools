<script setup lang="ts">
import { computed } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormField } from '../../types'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormMatrixField, FormMatrixRow } from './types'

const props = defineProps<{
  field: FormMatrixField
  path: readonly string[]
}>()
const formUi = useFormUi()

const visibleFields = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const matrixId = computed<string>(() => props.path.join('-'))
const minWidth = computed(() =>
  typeof props.field.minWidth === 'number'
    ? `${props.field.minWidth}px`
    : (props.field.minWidth ?? '40rem'),
)

function rowPath(row: FormMatrixRow) {
  return [...props.path, row.key]
}

function fieldLabel(field: FormField) {
  return 'label' in field ? (resolveFormText(field.label) ?? field.key) : field.key
}

function rowLabelId(row: FormMatrixRow) {
  return `${matrixId.value}-row-${row.key}`
}

function columnLabelId(field: FormField) {
  return `${matrixId.value}-column-${field.key}`
}

function controlClass(field: FormField) {
  const compact =
    field.type === 'checkbox' ||
    field.type === 'switch' ||
    field.type === 'rating' ||
    field.type === 'color-picker'
  return mergeFormUiClass(
    compact
      ? 'flex min-h-9 w-full items-center justify-center'
      : 'mx-auto flex min-h-9 w-full max-w-64 items-center justify-center',
    formUi.ui.value.matrix?.ui?.control,
  )
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div
      :class="
        mergeFormUiClass(
          'w-full overflow-x-auto rounded-lg border border-default bg-default',
          formUi.ui.value.matrix?.ui?.root,
        )
      "
    >
      <table
        :class="
          mergeFormUiClass('w-full border-collapse text-sm', formUi.ui.value.matrix?.ui?.table)
        "
        :style="{ minWidth }"
      >
        <thead
          :class="mergeFormUiClass('bg-elevated/70 text-muted', formUi.ui.value.matrix?.ui?.head)"
        >
          <tr :class="formUi.ui.value.matrix?.ui?.headerRow">
            <th
              scope="col"
              :class="
                mergeFormUiClass(
                  'w-52 border-b border-r border-default px-4 py-3',
                  formUi.ui.value.matrix?.ui?.corner,
                )
              "
            />
            <th
              v-for="column in visibleFields"
              :id="columnLabelId(column)"
              :key="column.key"
              scope="col"
              :class="
                mergeFormUiClass(
                  'border-b border-r border-default px-4 py-3 text-center font-medium last:border-r-0',
                  formUi.ui.value.matrix?.ui?.columnHeader,
                )
              "
            >
              {{ fieldLabel(column) }}
            </th>
          </tr>
        </thead>
        <tbody :class="formUi.ui.value.matrix?.ui?.body">
          <tr
            v-for="row in field.rows"
            :key="row.key"
            :class="
              mergeFormUiClass(
                'align-middle transition-colors hover:bg-elevated/35 [&>*]:border-b [&>*]:border-default [&:last-child>*]:border-b-0',
                formUi.ui.value.matrix?.ui?.row,
              )
            "
          >
            <th
              :id="rowLabelId(row)"
              scope="row"
              :class="
                mergeFormUiClass(
                  'border-r border-default bg-elevated/35 px-4 py-3 text-left font-medium text-highlighted',
                  formUi.ui.value.matrix?.ui?.rowHeader,
                )
              "
            >
              {{ resolveFormText(row.label) ?? row.key }}
            </th>
            <td
              v-for="column in visibleFields"
              :key="column.key"
              :headers="`${rowLabelId(row)} ${columnLabelId(column)}`"
              :class="
                mergeFormUiClass(
                  'border-r border-default px-3 py-2.5 text-center last:border-r-0',
                  formUi.ui.value.matrix?.ui?.cell,
                )
              "
            >
              <div :class="controlClass(column)">
                <FormFieldRenderer :field="column" :parent-path="rowPath(row)" bare />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </FormFieldShell>
</template>
