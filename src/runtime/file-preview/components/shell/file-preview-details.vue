<script setup lang="ts">
import { useUiToolsLocale } from '../../../i18n/use-locale'

defineProps<{ rows: readonly { label: string; value: string }[] }>()

const { t } = useUiToolsLocale()
</script>

<template>
  <section
    class="absolute top-3 right-3 z-20 w-[min(320px,calc(100%-24px))] rounded-xl border border-default bg-default px-4 py-3.5 shadow-lg"
    :aria-label="t('filePreview.details')"
    data-file-preview-details=""
  >
    <p class="m-0 mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">
      {{ t('filePreview.details') }}
    </p>
    <dl class="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]">
      <template v-for="row in rows" :key="row.label">
        <dt class="text-muted">{{ row.label }}</dt>
        <dd class="m-0 text-toned tabular-nums [overflow-wrap:anywhere]">{{ row.value }}</dd>
      </template>
    </dl>
  </section>
</template>
