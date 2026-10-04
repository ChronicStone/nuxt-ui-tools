<script setup lang="ts">
import { computed, useId } from 'vue'

import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useResolvedFieldProps } from '../../composables/use-field-control'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormField } from '../../types'
import { isNumber } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormMatrixField, FormMatrixRow } from './types'
import { groupMatrixEntries } from './utils'

const props = defineProps<{
  field: FormMatrixField
  path: readonly string[]
}>()

const fieldProps = useResolvedFieldProps(
  () => props.field,
  () => props.path,
)
const formUi = useFormUi()
const matrixInstanceId = useId()

const visibleFields = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const groups = computed(() => groupMatrixEntries(props.field.rows))
const matrixId = computed<string>(() => `${matrixInstanceId}-${props.path.join('-')}`)
const minWidth = computed(() =>
  isNumber(fieldProps.value.minWidth)
    ? `${fieldProps.value.minWidth}px`
    : (fieldProps.value.minWidth ?? '40rem'),
)
const rowHeaderWidth = computed(() =>
  isNumber(fieldProps.value.rowHeaderWidth)
    ? `${fieldProps.value.rowHeaderWidth}px`
    : (fieldProps.value.rowHeaderWidth ?? '13rem'),
)
const bordered = computed(() => fieldProps.value.bordered !== false)
const hoverable = computed(() => fieldProps.value.hoverable !== false)
const rowPadding = computed(() => (fieldProps.value.compact ? 'px-3 py-2' : 'px-4 py-3'))
const cellPadding = computed(() => (fieldProps.value.compact ? 'px-2 py-1.5' : 'px-3 py-2.5'))
const sectionPadding = computed(() => (fieldProps.value.compact ? 'px-3 py-1.5' : 'px-4 py-2'))

function rowPath(row: FormMatrixRow) {
  return [...props.path, row.key]
}

function fieldLabel(field: FormField) {
  return 'label' in field ? (resolveFormText(field.label) ?? field.key) : field.key
}

function rowLabelId(row: FormMatrixRow) {
  return `${matrixId.value}-row-${row.key}`
}

function sectionId(index: number) {
  return `${matrixId.value}-section-${index}`
}

function columnLabelId(field: FormField) {
  return `${matrixId.value}-column-${field.key}`
}

function cellHeaders(options: { row: FormMatrixRow; column: FormField; section: number | null }) {
  return [
    options.section === null ? null : sectionId(options.section),
    rowLabelId(options.row),
    columnLabelId(options.column),
  ]
    .filter(Boolean)
    .join(' ')
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
                    'text-left font-medium',
                    bordered ? 'border-b border-r border-default' : 'border-b border-default',
                  ].join(' '),
                  formUi.ui.value.matrix?.ui?.corner,
                )
              "
              :style="{ width: rowHeaderWidth, minWidth: rowHeaderWidth }"
            >
              {{ resolveFormText(fieldProps.rowHeaderLabel) }}
            </th>
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
        <tbody
          v-for="(group, groupIndex) in groups"
          :key="group.section ? `section-${groupIndex}` : `rows-${groupIndex}`"
          :class="
            mergeFormUiClass(
              '[&:not(:last-child)>tr:last-child>*]:border-b [&:not(:last-child)>tr:last-child>*]:border-default',
              formUi.ui.value.matrix?.ui?.body,
            )
          "
          data-matrix-group
        >
          <tr
            v-if="group.section"
            :class="mergeFormUiClass('bg-elevated/50', formUi.ui.value.matrix?.ui?.section)"
            data-matrix-section
          >
            <th
              :id="sectionId(groupIndex)"
              scope="rowgroup"
              :colspan="visibleFields.length + 1"
              :class="
                mergeFormUiClass(
                  [sectionPadding, 'border-b border-default text-left font-normal'].join(' '),
                  formUi.ui.value.matrix?.ui?.sectionHeader,
                )
              "
            >
              <span
                :class="
                  mergeFormUiClass(
                    'block text-xs font-semibold text-highlighted',
                    formUi.ui.value.matrix?.ui?.sectionLabel,
                  )
                "
              >
                {{ resolveFormText(group.section.label) }}
              </span>
              <span
                v-if="group.section.description"
                :class="
                  mergeFormUiClass(
                    'mt-0.5 block text-xs text-muted',
                    formUi.ui.value.matrix?.ui?.sectionDescription,
                  )
                "
              >
                {{ resolveFormText(group.section.description) }}
              </span>
            </th>
          </tr>
          <tr
            v-for="row in group.rows"
            :key="row.key"
            :class="
              mergeFormUiClass(
                [
                  'align-middle transition-colors',
                  hoverable ? 'hover:bg-elevated/35' : '',
                  fieldProps.striped ? 'even:bg-elevated/20' : '',
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
              <span :class="mergeFormUiClass('block', formUi.ui.value.matrix?.ui?.rowLabel)">
                {{ resolveFormText(row.label) ?? row.key }}
              </span>
              <span
                v-if="row.description"
                :class="
                  mergeFormUiClass(
                    'mt-0.5 block text-xs font-normal text-muted',
                    formUi.ui.value.matrix?.ui?.rowDescription,
                  )
                "
              >
                {{ resolveFormText(row.description) }}
              </span>
            </th>
            <td
              v-for="column in visibleFields"
              :key="column.key"
              :headers="cellHeaders({ row, column, section: group.section ? groupIndex : null })"
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
