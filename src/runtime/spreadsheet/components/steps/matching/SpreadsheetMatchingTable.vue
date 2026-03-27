<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { SpreadsheetColumnAssignmentOption } from '../../../types'

type MatchingOption = SpreadsheetColumnAssignmentOption & {
  headerIndex: number
  selected?: boolean
}

type ExpectedFieldRow = {
  key: string
  systemFieldKey: string
  systemFieldLabel: string
  required: boolean
  selectedHeaderIndex: number | null
  selectedFileColumn: string
  status: 'matched' | 'unmatched'
}

type AutoMappedRow = {
  key: string
  systemFieldLabel: string
  selectedFileColumn: string
}

type IgnoredColumnRow = {
  key: string
  fileColumn: string
}

const props = defineProps<{
  expectedFieldRows: ExpectedFieldRow[]
  autoMappedRows: AutoMappedRow[]
  ignoredColumnRows: IgnoredColumnRow[]
  getOptionsForRow: (row: { systemFieldKey: string, selectedHeaderIndex: number | null }) => MatchingOption[]
}>()

const emit = defineEmits<{
  assign: [payload: { headerIndex: number, columnKey: string }]
}>()
const { t } = useUiToolsLocale()

function getMatchBadgeProps(status: 'matched' | 'unmatched') {
  if (status === 'matched')
    return { color: 'success' as const, label: t('spreadsheet.steps.matching.matched'), dotClass: 'bg-success' }

  return { color: 'warning' as const, label: t('spreadsheet.steps.matching.needsMatch'), dotClass: 'bg-warning' }
}

function getLeadingDotClass(status: 'matched' | 'unmatched') {
  return status === 'matched' ? 'bg-success' : 'bg-warning'
}

function getRequiredBadgeColor(required: boolean) {
  return required ? 'error' as const : 'neutral' as const
}

function handleAssign(row: ExpectedFieldRow, value: unknown) {
  if (typeof value !== 'string') return
  if (value === '__ignore__') {
    if (row.selectedHeaderIndex == null) return
    emit('assign', {
      headerIndex: row.selectedHeaderIndex,
      columnKey: '',
    })
    return
  }

  const selectedOption = props.getOptionsForRow(row).find(option => option.key === value)
  const headerIndex = selectedOption?.headerIndex
  if (typeof headerIndex !== 'number') return

  emit('assign', {
    headerIndex,
    columnKey: value,
  })
}
</script>

<template>
  <div class="grid min-h-0 gap-4">
    <div class="flex min-h-0 flex-col overflow-hidden border border-default/70 bg-default">
      <div class="grid h-11 grid-cols-[40px_minmax(14rem,1fr)_120px_minmax(16rem,1.2fr)_minmax(9rem,0.8fr)] items-center border-b border-default/70 bg-elevated/20 px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        <div />
        <div>{{ t('spreadsheet.steps.matching.systemField') }}</div>
        <div>{{ t('spreadsheet.steps.matching.requirement') }}</div>
        <div>{{ t('spreadsheet.steps.matching.spreadsheetColumn') }}</div>
        <div>{{ t('spreadsheet.steps.matching.statusHeader') }}</div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto">
        <div
          v-for="row in expectedFieldRows"
          :key="row.key"
          class="grid min-h-12 grid-cols-[40px_minmax(14rem,1fr)_120px_minmax(16rem,1.2fr)_minmax(9rem,0.8fr)] items-center border-b border-default/50 px-5 py-2 transition-colors hover:bg-elevated/20 last:border-b-0"
        >
          <div class="flex justify-center">
            <span class="size-2 rounded-full" :class="getLeadingDotClass(row.status)" />
          </div>

          <div class="min-w-0">
            <div class="truncate font-mono text-sm font-medium text-highlighted">
              {{ row.systemFieldLabel }}
            </div>
          </div>

          <div class="flex items-center">
            <UBadge :color="getRequiredBadgeColor(row.required)" variant="soft" size="sm" class="font-mono">
              {{ row.required ? t('spreadsheet.steps.matching.required') : t('spreadsheet.steps.matching.optional') }}
            </UBadge>
          </div>

          <div class="min-w-0">
            <USelectMenu
              :items="getOptionsForRow(row)"
              :model-value="row.systemFieldKey"
              value-key="key"
              label-key="label"
              color="neutral"
              variant="none"
              :search-input="{ variant: 'none', placeholder: t('spreadsheet.steps.matching.searchColumns') }"
              :placeholder="t('spreadsheet.steps.matching.selectColumn')"
              class="w-fit max-w-full"
              :ui="{
                base: [
                  'min-h-0 w-fit max-w-full px-0 py-0 font-mono text-sm shadow-none ring-0',
                  row.status === 'matched' ? 'text-toned' : 'text-warning',
                ],
                value: 'truncate pr-5',
                placeholder: 'truncate pr-5',
                trailing: 'end-0',
                trailingIcon: 'size-3.5 text-muted',
                content: 'w-auto min-w-80',
                viewport: 'max-h-72',
                input: 'border-b border-default px-3 py-2',
                item: 'font-mono',
                itemLabel: 'font-mono text-sm',
                itemTrailing: 'ms-auto items-center',
              }"
              @update:model-value="handleAssign(row, $event)"
            >
              <template #item="{ item }">
                <div class="flex items-center justify-between gap-3">
                  <span class="truncate font-mono text-sm" :class="item.assigned ? 'text-muted' : 'text-default'">
                    {{ item.label }}
                  </span>
                  <span
                    class="font-mono text-[10px] uppercase tracking-[0.12em]"
                    :class="item.assigned ? 'text-muted' : 'text-success'"
                  >
                    {{ item.assigned ? t('spreadsheet.steps.matching.assigned') : t('spreadsheet.steps.matching.available') }}
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>

          <div class="flex items-center">
            <UBadge :color="getMatchBadgeProps(row.status).color" variant="soft" class="font-mono">
              <span class="mr-1.5 inline-block size-1.5 rounded-full" :class="getMatchBadgeProps(row.status).dotClass" />
              {{ getMatchBadgeProps(row.status).label }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="autoMappedRows.length"
      class="overflow-hidden border border-default/70 bg-default"
    >
      <div
        class="grid h-10 grid-cols-[minmax(14rem,1fr)_40px_minmax(14rem,1fr)] items-center border-b border-default/70 bg-elevated/20 px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        <div>{{ t('spreadsheet.steps.matching.autoMappedField') }}</div>
        <div class="flex justify-center">
          <UIcon name="i-lucide-arrow-right" class="size-3.5" />
        </div>
        <div>{{ t('spreadsheet.steps.matching.spreadsheetColumn') }}</div>
      </div>

      <div
        v-for="row in autoMappedRows"
        :key="row.key"
        class="grid min-h-11 grid-cols-[minmax(14rem,1fr)_40px_minmax(14rem,1fr)] items-center border-b border-default/50 px-5 py-2 last:border-b-0"
      >
        <div class="truncate font-mono text-sm font-medium text-highlighted">
          {{ row.systemFieldLabel }}
        </div>
        <div class="flex justify-center">
          <UIcon name="i-lucide-arrow-right" class="size-3.5 text-muted" />
        </div>
        <div class="truncate font-mono text-sm text-toned">
          {{ row.selectedFileColumn }}
        </div>
      </div>
    </div>

    <div
      v-if="ignoredColumnRows.length"
      class="overflow-hidden border border-default/70 bg-default"
    >
      <div class="grid h-10 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-default/70 bg-elevated/20 px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        <div>{{ t('spreadsheet.steps.matching.ignoredColumns') }}</div>
        <div>{{ ignoredColumnRows.length }}</div>
      </div>

      <div class="flex flex-wrap gap-2 px-5 py-4">
        <UBadge
          v-for="row in ignoredColumnRows"
          :key="row.key"
          color="neutral"
          variant="subtle"
          class="font-mono"
        >
          {{ row.fileColumn }}
        </UBadge>
      </div>
    </div>
  </div>
</template>
