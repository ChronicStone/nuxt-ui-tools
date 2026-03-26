<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'

import { formatSpreadsheetCell } from '../../utils/display'
import { getSpreadsheetObjectEntries, isSpreadsheetRecord } from '../../utils/object'

const props = withDefaults(defineProps<{
  value: unknown
  compact?: boolean
}>(), {
  compact: false,
})

const compactLimit = 2

function getCompactArrayItems(value: readonly unknown[]) {
  return props.compact ? value.slice(0, compactLimit) : value
}

function getCompactObjectEntries(value: Record<string, unknown>) {
  const entries = getSpreadsheetObjectEntries(value)
  return props.compact ? entries.slice(0, compactLimit) : entries
}

function getValueKind(value: unknown) {
  if (value == null) return 'empty'
  if (Array.isArray(value)) return 'array'
  if (isSpreadsheetRecord(value)) return 'object'
  return 'primitive'
}

function getObjectSummary(value: Record<string, unknown>) {
  const entries = getSpreadsheetObjectEntries(value)
  return `${entries.length} field${entries.length > 1 ? 's' : ''}`
}

function getArraySummary(value: readonly unknown[]) {
  return `${value.length} item${value.length > 1 ? 's' : ''}`
}
</script>

<template>
  <span v-if="value == null" class="text-muted">—</span>

  <span v-else-if="typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'" class="text-current">
    {{ formatSpreadsheetCell(value) }}
  </span>

  <UPopover
    v-else-if="Array.isArray(value)"
    mode="hover"
    :content="{ side: 'top', align: 'start', sideOffset: 10 }"
    :ui="{ content: 'w-80 max-w-[calc(100vw-2rem)] overflow-hidden border border-default/70 bg-default p-0 shadow-lg' }"
  >
    <div class="flex flex-wrap items-center gap-2">
      <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">
        {{ getArraySummary(value) }}
      </UBadge>
      <UBadge
        v-for="(item, index) in getCompactArrayItems(value)"
        :key="`${index}:${formatSpreadsheetCell(item)}`"
        color="neutral"
        variant="outline"
        size="sm"
        class="max-w-full"
      >
        <span class="truncate">{{ formatSpreadsheetCell(item) }}</span>
      </UBadge>
      <span v-if="props.compact && value.length > compactLimit" class="text-[11px] text-muted">
        +{{ value.length - compactLimit }}
      </span>
    </div>

    <template #content>
      <div class="grid gap-3 p-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-semibold text-highlighted">Array value</span>
          <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">
            {{ getArraySummary(value) }}
          </UBadge>
        </div>

        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(item, index) in value"
            :key="`${index}:${formatSpreadsheetCell(item)}`"
            color="neutral"
            variant="outline"
            size="sm"
          >
            {{ formatSpreadsheetCell(item) }}
          </UBadge>
        </div>
      </div>
    </template>
  </UPopover>

  <UPopover
    v-else-if="isSpreadsheetRecord(value)"
    mode="hover"
    :content="{ side: 'top', align: 'start', sideOffset: 10 }"
    :ui="{ content: 'w-96 max-w-[calc(100vw-2rem)] overflow-hidden border border-default/70 bg-default p-0 shadow-lg' }"
  >
    <div class="flex flex-wrap items-center gap-2">
      <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">
        {{ getObjectSummary(value) }}
      </UBadge>
      <UBadge
        v-for="[key] in getCompactObjectEntries(value)"
        :key="key"
        color="neutral"
        variant="outline"
        size="sm"
      >
        {{ key }}
      </UBadge>
      <span v-if="props.compact && getSpreadsheetObjectEntries(value).length > compactLimit" class="text-[11px] text-muted">
        +{{ getSpreadsheetObjectEntries(value).length - compactLimit }}
      </span>
    </div>

    <template #content>
      <div class="grid gap-3 p-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-semibold text-highlighted">Object value</span>
          <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">
            {{ getObjectSummary(value) }}
          </UBadge>
        </div>

        <div class="grid gap-2">
          <div
            v-for="[key, entryValue] in getSpreadsheetObjectEntries(value)"
            :key="key"
            class="grid gap-2 rounded-md border border-default/60 bg-elevated/15 px-3 py-3"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-mono text-[11px] text-muted">{{ key }}</span>
              <UBadge
                v-if="getValueKind(entryValue) !== 'primitive'"
                color="neutral"
                variant="subtle"
                size="xs"
                class="font-mono"
              >
                {{ getValueKind(entryValue) }}
              </UBadge>
            </div>

            <div v-if="Array.isArray(entryValue)" class="flex flex-wrap gap-2">
              <UBadge
                v-for="(item, index) in entryValue"
                :key="`${key}:${index}:${formatSpreadsheetCell(item)}`"
                color="neutral"
                variant="outline"
                size="sm"
              >
                {{ formatSpreadsheetCell(item) }}
              </UBadge>
            </div>

            <div v-else-if="isSpreadsheetRecord(entryValue)" class="grid gap-2">
              <div
                v-for="[nestedKey, nestedValue] in getSpreadsheetObjectEntries(entryValue)"
                :key="`${key}:${nestedKey}`"
                class="flex items-start justify-between gap-3 rounded-md border border-default/50 bg-default px-3 py-2"
              >
                <span class="font-mono text-[11px] text-muted">{{ nestedKey }}</span>
                <span class="max-w-[70%] text-right text-sm text-toned">{{ formatSpreadsheetCell(nestedValue) }}</span>
              </div>
            </div>

            <div v-else class="text-sm text-toned">
              {{ formatSpreadsheetCell(entryValue) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </UPopover>

  <span v-else class="text-toned">
    {{ formatSpreadsheetCell(value) }}
  </span>
</template>
