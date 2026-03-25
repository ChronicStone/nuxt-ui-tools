<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  fileName?: string
  totalSheets: number
  rowCount: number
  hasWorkbook: boolean
}>()
</script>

<template>
  <div class="flex min-h-12 flex-wrap items-center gap-4 border border-default/70 bg-default px-5 py-3">
    <template v-if="hasWorkbook">
      <UIcon name="i-lucide-file-spreadsheet" class="size-[18px] text-success" />
      <span class="font-mono text-xs font-medium text-highlighted">
        {{ fileName ?? 'Untitled workbook' }}
      </span>
      <div class="h-4 w-px bg-default/70" />
      <span class="font-mono text-[11px] text-muted">
        {{ totalSheets }} sheets · {{ rowCount }} rows
      </span>
    </template>

    <template v-else>
      <UIcon name="i-lucide-file-spreadsheet" class="size-[18px] text-muted" />
      <span class="font-mono text-[11px] text-muted">
        No file loaded
      </span>
    </template>
  </div>
</template>
