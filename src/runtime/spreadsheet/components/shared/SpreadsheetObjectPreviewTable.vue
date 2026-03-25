<script setup lang="ts">
import UTable from '@nuxt/ui/components/Table.vue'
import { computed } from 'vue'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenRecord(value: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((acc, [key, nextValue]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(nextValue))
      return {
        ...acc,
        [nextKey]: nextValue.join(', '),
      }

    if (isRecord(nextValue))
      return {
        ...acc,
        ...flattenRecord(nextValue, nextKey),
      }

    return {
      ...acc,
      [nextKey]: nextValue == null ? '' : String(nextValue),
    }
  }, {})
}

const props = defineProps<{
  rows: readonly Record<string, unknown>[]
}>()

const flattenedRows = computed(() =>
  props.rows.map((row, index) => ({
    __rowLabel: index + 1,
    ...flattenRecord(row),
  })),
)

const columnKeys = computed(() => {
  const keys = new Set<string>()
  for (const row of flattenedRows.value) {
    for (const key of Object.keys(row)) {
      if (key === '__rowLabel') continue
      keys.add(key)
    }
  }

  return Array.from(keys)
})

const columns = computed(() => [
  {
    accessorKey: '__rowLabel',
    header: '#',
  },
  ...columnKeys.value.map((key) => ({
    accessorKey: key,
    header: key,
  })),
])
</script>

<template>
  <UTable
    :data="flattenedRows"
    :columns="columns"
    sticky="header"
    class="border-t border-default/70"
  />
</template>
