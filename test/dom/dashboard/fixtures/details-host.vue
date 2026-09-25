<script setup lang="ts">
import type { DashboardSourceLike } from '#ui-tools/dashboard'
import DashboardDetails from '#ui-tools/dashboard/components/dashboard-details.vue'

export interface Profile {
  name: string
  vatNumber: string | null
  units: number
  kind: 'customer' | 'partner'
  website: string | null
}

defineProps<{ source: DashboardSourceLike<Profile | undefined> }>()
</script>

<template>
  <DashboardDetails
    :source
    title="Identity"
    columns="2"
    :items="[
      { key: 'name', label: 'Name', value: (profile) => profile.name },
      {
        key: 'vat',
        label: 'VAT',
        value: (profile) => profile.vatNumber,
        placeholder: 'Not provided',
        mono: true,
        copy: true,
      },
      {
        key: 'units',
        label: 'Units',
        value: (profile) => profile.units,
        format: 'integer',
        span: 'full',
      },
      {
        key: 'commission',
        label: 'Commission',
        value: () => '12 %',
        hidden: (profile) => profile.kind !== 'partner',
      },
      {
        key: 'website',
        label: 'Website',
        value: (profile) => profile.website,
        to: (profile) => profile.website,
      },
      { key: 'kind', label: 'Kind', value: (profile) => profile.kind },
    ]"
  >
    <template #item-kind="{ value }">
      <mark>{{ value?.toUpperCase() }}</mark>
    </template>
  </DashboardDetails>
</template>
