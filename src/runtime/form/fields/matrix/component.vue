<script setup lang="ts">
import { computed, useId } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormField } from '../../types'
import { isNumber } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormMatrixField, FormMatrixRow } from './types'

const props = defineProps<{
  field: FormMatrixField
  path: readonly string[]
}>()
const formUi = useFormUi()
const matrixInstanceId = useId()

const visibleFields = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const matrixId = computed<string>(() => `${matrixInstanceId}-${props.path.join('-')}`)
const minWidth = computed(() =>
  isNumber(props.field.minWidth) ? `${props.field.minWidth}px` : (props.field.minWidth ?? '40rem'),
)
const rowHeaderWidth = computed(() =>
  isNumber(props.field.rowHeaderWidth)
    ? `${props.field.rowHeaderWidth}px`
    : (props.field.rowHeaderWidth ?? '13rem'),
)
const bordered = computed(() => props.field.bordered !== false)
const hoverable = computed(() => props.field.hoverable !== false)
const rowPadding = computed(() => (props.field.compact ? 'px-3 py-2' : 'px-4 py-3'))
const cellPadding = computed(() => (props.field.compact ? 'px-2 py-1.5' : 'px-3 py-2.5'))

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
          bordered
            ? 'w-full overflow-x-auto rounded-lg border border-default bg-default'
            : 'w-full overflow-x-auto bg-default',
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
                  [
                    rowPadding,
                    bordered ? 'border-b border-r border-default' : 'border-b border-default',
                  ].join(' '),
                  formUi.ui.value.matrix?.ui?.corner,
                )
              "
              :style="{ width: rowHeaderWidth, minWidth: rowHeaderWidth }"
            />
            <th
              v-for="column in visibleFields"
              :id="columnLabelId(column)"
              :key="column.key"
              scope="col"
              :class="
                mergeFormUiClass(
                  [
                    rowPadding,
                    'border-b border-default text-center font-medium',
                    bordered ? 'border-r last:border-r-0' : '',
                  ].join(' '),
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
                [
                  'align-middle transition-colors',
                  hoverable ? 'hover:bg-elevated/35' : '',
                  field.striped ? 'even:bg-elevated/20' : '',
                  '[&>*]:border-b [&>*]:border-default [&:last-child>*]:border-b-0',
                ].join(' '),
                formUi.ui.value.matrix?.ui?.row,
              )
            "
          >
            <th
              :id="rowLabelId(row)"
              scope="row"
              :class="
                mergeFormUiClass(
                  [
                    rowPadding,
                    'bg-elevated/35 text-left font-medium text-highlighted',
                    bordered ? 'border-r border-default' : '',
                  ].join(' '),
                  formUi.ui.value.matrix?.ui?.rowHeader,
                )
              "
              :style="{ width: rowHeaderWidth, minWidth: rowHeaderWidth }"
            >
              {{ resolveFormText(row.label) ?? row.key }}
            </th>
            <td
              v-for="column in visibleFields"
              :key="column.key"
              :headers="`${rowLabelId(row)} ${columnLabelId(column)}`"
              :class="
                mergeFormUiClass(
                  [
                    cellPadding,
                    'text-center',
                    bordered ? 'border-r border-default last:border-r-0' : '',
                  ].join(' '),
                  formUi.ui.value.matrix?.ui?.cell,
                )
              "
            >
              <div :class="controlClass(column)">
                <FormFieldRenderer
                  :field="column"
                  :parent-path="rowPath(row)"
                  :control-labelledby="`${rowLabelId(row)} ${columnLabelId(column)}`"
                  bare
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </FormFieldShell>
</template>
