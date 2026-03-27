<script setup lang="ts">
import { useUiToolsLocale } from '#ui-tools/i18n'

const props = defineProps<{
  items: Array<{
    label: string
    rowCount: number
    columnCount: number
  }>
  selectedSheetName?: string
}>()
const { locale, t } = useUiToolsLocale()

const emit = defineEmits<{
  select: [sheetName: string]
}>()

function isSelectedSheet(index: number, sheetLabel: string) {
  return props.selectedSheetName === sheetLabel
    || (!props.selectedSheetName && index === 0)
}

function formatCount(value: number) {
  return new Intl.NumberFormat(locale.value.code).format(value)
}
</script>

<template>
  <div class="grid gap-2 self-start">
    <h3 class="text-[13px] font-semibold text-highlighted">
      {{ t('spreadsheet.steps.structure.sheetLabel') }}
    </h3>

    <button
      v-for="(sheet, index) in items"
      :key="sheet.label"
      type="button"
      class="flex items-center gap-3 border bg-default px-4 py-3 text-left transition-colors"
      :class="isSelectedSheet(index, sheet.label)
        ? 'border-2 border-inverted text-default'
        : 'border-default/70 text-toned hover:border-default'"
      @click="emit('select', sheet.label)"
    >
      <div
        class="size-3.5 rounded-full"
        :class="isSelectedSheet(index, sheet.label)
          ? 'bg-inverted'
          : 'border border-default/70 bg-default'"
      />
      <div class="grid gap-0.5">
        <span class="text-[13px]" :class="isSelectedSheet(index, sheet.label) ? 'font-medium text-highlighted' : 'text-toned'">{{ sheet.label }}</span>
        <span class="font-mono text-[11px] text-muted">{{
          t('spreadsheet.common.sheetStats', {
            rows: formatCount(sheet.rowCount),
            columns: formatCount(sheet.columnCount),
          })
        }}</span>
      </div>
    </button>
  </div>
</template>
