<script setup lang="ts">
import UAccordion from '@nuxt/ui/components/Accordion.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'

import type { SpreadsheetReferenceResolution } from '../../../types'

type ReferenceSelectItem = {
  kind?: 'option' | 'divider'
  value?: unknown
  label: string
  description?: string
  disabled?: boolean
}

type ReferenceGroup = {
  resolutionKey: string
  sourceField: string
  outputField: string
  sourceLabel: string
  outputLabel: string
  resolvedCount: number
  unresolvedCount: number
  progressWidth: string
  items: SpreadsheetReferenceResolution[]
}

const expandedResolutionKey = defineModel<string | undefined>()

defineProps<{
  groups: ReferenceGroup[]
  getSelectItems: (resolution: SpreadsheetReferenceResolution) => ReferenceSelectItem[]
  getResolutionBadge: (resolution: SpreadsheetReferenceResolution) => {
    label: string
    color: 'success' | 'warning' | 'error'
  }
  getMetaTone: (resolution: SpreadsheetReferenceResolution) => {
    label: string
    class: string
  } | null
  getRowCountLabel: (count: number) => string
}>()

const emit = defineEmits<{
  select: [payload: { resolution: SpreadsheetReferenceResolution; value: unknown }]
}>()

function getResolutionTone(resolution: SpreadsheetReferenceResolution) {
  return resolution.status === 'matched' ? 'resolved' : 'unresolved'
}
</script>

<template>
  <UAccordion
    v-model="expandedResolutionKey"
    :items="groups"
    type="single"
    collapsible
    value-key="resolutionKey"
    :ui="{
      root: 'grid min-h-0 gap-3',
      item: 'overflow-hidden rounded-[var(--ui-radius)] border border-default/70 bg-default',
      header: 'm-0',
      trigger:
        'flex h-13 w-full items-center justify-between gap-4 px-5 text-left transition-colors hover:bg-elevated/20',
      content: 'overflow-hidden',
      body: 'p-0',
    }"
  >
    <template #default="{ item, open }">
      <div class="flex min-w-0 items-center gap-3">
        <UIcon
          :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="size-4 shrink-0 text-muted"
        />

        <div class="flex min-w-0 items-center gap-3">
          <span
            class="truncate text-sm"
            :class="open ? 'font-semibold text-highlighted' : 'font-medium text-toned'"
          >
            {{ item.sourceLabel }}
          </span>
          <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 text-muted" />
          <span class="truncate font-mono text-xs text-muted">
            {{ item.outputLabel }}
          </span>
        </div>
      </div>
    </template>

    <template #trailing="{ item }">
      <div class="flex shrink-0 items-center gap-3">
        <template v-if="item.unresolvedCount">
          <span class="font-mono text-[11px] font-medium text-muted">
            {{ item.resolvedCount }} of {{ item.items.length }} resolved
          </span>
          <div class="h-1 w-20 overflow-hidden rounded-full bg-elevated">
            <div class="h-full bg-success" :style="{ width: item.progressWidth }" />
          </div>
        </template>

        <template v-else>
          <UBadge color="success" variant="soft" class="font-mono"> All resolved </UBadge>
          <div class="h-1 w-20 overflow-hidden rounded-full bg-elevated">
            <div class="h-full w-full bg-success" />
          </div>
        </template>
      </div>
    </template>

    <template #body="{ item }">
      <div class="grid">
        <div
          v-for="resolution in item.items"
          :key="`${resolution.referenceField}:${resolution.sourceValue}`"
          class="flex items-center gap-4 border-t border-default/60 bg-default px-5 py-3.5"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <div class="truncate font-mono text-sm font-medium text-highlighted">
                {{ resolution.sourceValue }}
              </div>

              <UBadge
                :color="getResolutionBadge(resolution).color"
                variant="soft"
                size="sm"
                class="font-mono"
              >
                {{ getResolutionBadge(resolution).label }}
              </UBadge>
            </div>

            <div
              class="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted"
            >
              <span>{{ getRowCountLabel(resolution.rowIndexes.length) }}</span>
              <template v-if="getMetaTone(resolution)">
                <span>&middot;</span>
                <span :class="getMetaTone(resolution)?.class">
                  {{ getMetaTone(resolution)?.label }}
                </span>
              </template>
            </div>
          </div>

          <UIcon
            name="i-lucide-arrow-right"
            class="size-3.5 shrink-0"
            :class="getResolutionTone(resolution) === 'unresolved' ? 'text-warning' : 'text-muted'"
          />

          <div class="shrink-0">
            <USelectMenu
              :items="getSelectItems(resolution)"
              :model-value="resolution.selectedValue"
              value-key="value"
              label-key="label"
              description-key="description"
              variant="subtle"
              size="sm"
              :placeholder="
                getResolutionTone(resolution) === 'unresolved' ? 'Select value...' : undefined
              "
              :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
              class="w-56 min-w-56 max-w-56"
              :ui="{ content: 'w-80 max-w-sm' }"
              @update:model-value="emit('select', { resolution, value: $event })"
            >
              <template #item="{ item }">
                <div v-if="item.kind === 'divider'" class="flex items-center gap-3 py-1">
                  <div class="h-px flex-1 bg-default/70" />
                  <span class="shrink-0 text-xs uppercase text-muted">
                    {{ item.label }}
                  </span>
                  <div class="h-px flex-1 bg-default/70" />
                </div>

                <div v-else class="flex items-start justify-between gap-3">
                  <span
                    class="min-w-0 whitespace-normal break-words text-sm leading-5 text-default"
                  >
                    {{ item.label }}
                  </span>
                  <span
                    v-if="item.description"
                    class="shrink-0 pt-0.5 text-xs font-medium text-muted"
                  >
                    {{ item.description }}
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>
      </div>
    </template>
  </UAccordion>
</template>
