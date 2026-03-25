<script setup lang="ts">
import UTable from '@nuxt/ui/components/Table.vue'
import { computed } from 'vue'

const props = defineProps<{
  headers: readonly unknown[]
  rows: readonly (readonly unknown[])[]
}>()

const normalizedHeaders = computed(() =>
  props.headers.map((header, index) => ({
    key: `column_${index}`,
    label: String(header ?? `Column ${index + 1}`),
    index,
  })),
)

const tableRows = computed(() =>
  props.rows.map((row, rowIndex) =>
    normalizedHeaders.value.reduce<Record<string, unknown>>((acc, header) => ({
      ...acc,
      __rowLabel: rowIndex + 1,
      [header.key]: row[header.index] ?? '',
    }), {}),
  ),
)

const columns = computed(() => [
  {
    accessorKey: '__rowLabel',
    header: '#',
  },
  ...normalizedHeaders.value.map((header) => ({
    accessorKey: header.key,
    header: header.label,
  })),
])
</script>

<template>
  <UTable
    :data="tableRows"
    :columns="columns"
    sticky="header"
    class="border-t border-default/70"
  />
</template>
