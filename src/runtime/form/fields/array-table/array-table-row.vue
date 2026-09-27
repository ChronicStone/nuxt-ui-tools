<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import type { FormField } from '../../types'
import type { FormArrayTableUi } from '../../types/ui'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayCustomAction } from '../array-list/types'
import ArrayTableCell from './array-table-cell.vue'

/**
 * One row of an array table. Its props stay the same objects while the row is unchanged, so the
 * table can re-render, for example while it fills in its rows, without re-rendering every row.
 * Row actions are resolved here, where their reactive reads are tracked per row.
 */
const props = defineProps<{
  index: number
  itemPath: readonly string[]
  columns: readonly FormField[]
  actions: boolean
  draggable: boolean
  canDelete: (index: number) => boolean
  customActions: readonly FormArrayCustomAction[]
  customVisible: (index: number, actionIndex: number) => boolean
  ui?: FormArrayTableUi
  dragLabel: string
  removeLabel: string
}>()

const emit = defineEmits<{
  remove: [index: number]
  custom: [index: number, actionIndex: number]
}>()
</script>

<template>
  <tr
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
      :class="mergeFormUiClass('border-r border-default p-1.5 last:border-r-0', ui?.cell)"
    >
      <ArrayTableCell :field="column" :item-path="itemPath" />
    </td>
    <td
      v-if="actions"
      :class="
        mergeFormUiClass(
          'sticky right-0 whitespace-nowrap border-l border-default bg-default px-1.5 py-1.5 text-right shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.45)]',
          ui?.actionsCell,
        )
      "
    >
      <UButton
        v-if="draggable"
        icon="i-lucide-grip-vertical"
        color="neutral"
        variant="ghost"
        size="xs"
        :class="
          mergeFormUiClass('array-table-drag-handle cursor-grab active:cursor-grabbing', ui?.action)
        "
        :aria-label="dragLabel"
      />
      <UButton
        v-if="canDelete(props.index)"
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        size="xs"
        :class="ui?.action"
        :aria-label="removeLabel"
        @click="emit('remove', props.index)"
      />
      <UButton
        v-for="(action, actionIndex) in customActions"
        v-show="customVisible(props.index, actionIndex)"
        :key="actionIndex"
        :icon="action.icon"
        color="neutral"
        variant="ghost"
        size="xs"
        :class="ui?.action"
        @click="emit('custom', props.index, actionIndex)"
      >
        {{ resolveFormText(action.label) }}
      </UButton>
    </td>
  </tr>
</template>
