<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { SpreadsheetComponentApi } from '../types'
import SpreadsheetStructurePreviewTable from './structure/SpreadsheetStructurePreviewTable.vue'
import SpreadsheetStructureSheetList from './structure/SpreadsheetStructureSheetList.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()
const { t } = useUiToolsLocale()

const activeSheet = computed(() => props.spreadsheet.activeSheet.value)
const sheetItems = computed(() =>
  (props.spreadsheet.workbook.value?.sheets ?? []).map((sheet) => ({
    label: sheet.name,
    rowCount: Math.max(sheet.rows.length - 1, 0),
    columnCount: Math.max(...sheet.rows.map((row) => row.length), 0),
  })),
)
const previewRows = computed(() =>
  (activeSheet.value?.rows ?? []).map((row, index) => ({
      absoluteIndex: index,
      cells: row,
    })),
)
const previewColumnCount = computed(() =>
  Math.max(...previewRows.value.map((row) => row.cells.length), props.spreadsheet.headers.value.length, 0),
)

</script>

<template>
  <div class="grid h-full min-h-0 gap-6">
    <UAlert
      v-if="!spreadsheet.workbook.value"
      color="warning"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="t('spreadsheet.steps.structure.loadWorkbookFirstTitle')"
      :description="t('spreadsheet.steps.structure.loadWorkbookFirstDescription')"
    />

    <template v-else>
      <div class="grid min-h-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SpreadsheetStructureSheetList
          :items="sheetItems"
          :selected-sheet-name="spreadsheet.selection.value.sheetName"
          @select="spreadsheet.setSheetName"
        />

        <SpreadsheetStructurePreviewTable
          :rows="previewRows"
          :column-count="previewColumnCount"
          :selected-header-row-index="spreadsheet.selection.value.headerRowIndex"
          @select-header="spreadsheet.setHeaderRowIndex"
        />
      </div>
    </template>
  </div>
</template>
