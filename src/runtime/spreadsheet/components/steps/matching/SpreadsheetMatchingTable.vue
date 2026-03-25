<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'

import type { SpreadsheetColumnAssignmentOption } from '../../../types'

type MatchingRow = {
  key: string
  headerIndex: number
  fileColumn: string
  systemFieldKey: string
  systemFieldLabel: string
  status: 'matched' | 'ignored'
  locked: boolean
  kind: 'static' | 'dynamic' | 'ignored'
}

const props = defineProps<{
  rows: MatchingRow[]
  getOptionsForRow: (row: { systemFieldKey: string }) => SpreadsheetColumnAssignmentOption[]
}>()

const emit = defineEmits<{
  assign: [payload: { headerIndex: number, columnKey: string }]
}>()

function getBadgeProps(status: 'matched' | 'ignored') {
  if (status === 'ignored')
    return { color: 'neutral' as const, label: 'Ignored', dotClass: 'bg-muted' }

  return { color: 'success' as const, label: 'Matched', dotClass: 'bg-success' }
}

function getLeadingDotClass(status: 'matched' | 'ignored') {
  return status === 'ignored' ? 'bg-muted' : 'bg-success'
}

function getArrowIcon(status: 'matched' | 'ignored') {
  return status === 'ignored' ? 'i-lucide-minus' : 'i-lucide-arrow-right'
}

function getRowToneClass(status: 'matched' | 'ignored') {
  return status === 'ignored' ? 'opacity-50' : ''
}

function getTypeBadgeProps(kind: 'static' | 'dynamic' | 'ignored') {
  if (kind === 'dynamic')
    return { color: 'info' as const, label: 'Dynamic' }

  if (kind === 'ignored')
    return { color: 'neutral' as const, label: 'Ignored' }

  return null
}

function handleAssign(row: MatchingRow, value: unknown) {
  if (typeof value !== 'string') return
  emit('assign', {
    headerIndex: row.headerIndex,
    columnKey: value,
  })
}
</script>

<template>
  <div class="flex min-h-0 flex-col overflow-hidden border border-default/70 bg-default">
    <div class="grid h-11 grid-cols-[40px_minmax(14rem,1.35fr)_40px_minmax(14rem,1.35fr)_minmax(10rem,0.9fr)] items-center border-b border-default/70 bg-elevated/20 px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
      <div />
      <div>File column</div>
      <div class="flex justify-center">
        <UIcon name="i-lucide-arrow-right" class="size-3.5" />
      </div>
      <div>System field</div>
      <div>Status</div>
    </div>

    <div class="min-h-0 flex-1 overflow-auto">
      <div
        v-for="row in rows"
        :key="row.key"
        class="grid h-11 grid-cols-[40px_minmax(14rem,1.35fr)_40px_minmax(14rem,1.35fr)_minmax(10rem,0.9fr)] items-center border-b border-default/50 px-5 transition-colors hover:bg-elevated/20 last:border-b-0"
        :class="getRowToneClass(row.status)"
      >
        <div class="flex justify-center">
          <span class="size-2 rounded-full" :class="getLeadingDotClass(row.status)" />
        </div>

        <div class="flex min-w-0 items-center gap-2">
          <div class="truncate font-mono text-sm font-medium text-highlighted">
            {{ row.fileColumn }}
          </div>

          <UBadge
            v-if="getTypeBadgeProps(row.kind)"
            :color="getTypeBadgeProps(row.kind)?.color"
            variant="soft"
            size="sm"
            class="shrink-0 font-mono"
          >
            {{ getTypeBadgeProps(row.kind)?.label }}
          </UBadge>
        </div>

        <div class="flex justify-center">
          <UIcon :name="getArrowIcon(row.status)" class="size-3.5 text-muted" />
        </div>

        <div class="min-w-0">
          <USelectMenu
            v-if="!row.locked"
            :items="getOptionsForRow(row)"
            :model-value="row.systemFieldKey || undefined"
            value-key="key"
            label-key="label"
            color="neutral"
            variant="none"
            :search-input="{ variant: 'none', placeholder: 'Search fields...' }"
            placeholder="Select a field..."
            class="w-fit max-w-full"
            :ui="{
              base: [
                'min-h-0 w-fit max-w-full px-0 py-0 font-mono text-sm shadow-none ring-0',
                row.status === 'ignored' ? 'text-muted' : 'text-toned',
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
                  {{ item.assigned ? 'Assigned' : 'Available' }}
                </span>
              </div>
            </template>
          </USelectMenu>

          <div v-else class="truncate font-mono text-sm text-toned">
            {{ row.systemFieldLabel }}
          </div>
        </div>

        <div class="flex items-center">
          <UBadge :color="getBadgeProps(row.status).color" variant="soft" class="font-mono">
            <span class="mr-1.5 inline-block size-1.5 rounded-full" :class="getBadgeProps(row.status).dotClass" />
            {{ getBadgeProps(row.status).label }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>
