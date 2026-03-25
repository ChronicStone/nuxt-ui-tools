<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref, watch } from 'vue'

import type { SpreadsheetComponentApi } from '../types'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
  onDownloadTemplate?: () => void
}>()

const file = ref<File | null>(null)

const accept = computed(() =>
  props.spreadsheet.schema.value.source?.accept?.join(',') ?? '.xlsx,.xls,.csv',
)

watch(file, (nextFile) => {
  if (!nextFile) return

  props.spreadsheet.loadSource({
    source: nextFile,
    fileName: nextFile.name,
  })
})
</script>

<template>
  <div class="grid gap-6">
    <UFileUpload
      v-model="file"
      :accept="accept"
      variant="area"
      color="neutral"
      layout="list"
      label="Drop your spreadsheet here"
      description="or click to browse — .xlsx, .xls, .csv supported"
      class="min-h-[20rem]"
    >
      <template #leading>
        <UIcon name="i-lucide-upload" class="size-8 text-muted" />
      </template>
    </UFileUpload>

    <UAlert
      v-if="spreadsheet.sourceError.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Workbook parsing failed"
      :description="String(spreadsheet.sourceError.value)"
    />

    <div class="max-w-sm">
      <button
        type="button"
        class="group text-left"
        @click="onDownloadTemplate?.()"
      >
        <UCard class="transition-colors group-hover:border-primary/50 group-hover:bg-elevated/60">
          <div class="flex items-center gap-4">
            <UIcon name="i-lucide-file-spreadsheet" class="size-5 text-toned" />
            <div class="grid gap-0.5">
              <h3 class="text-sm font-medium text-highlighted">
                Download template
              </h3>
              <p class="text-xs text-muted">
                Get the expected format for assessment imports
              </p>
            </div>
          </div>
        </UCard>
      </button>
    </div>
  </div>
</template>
