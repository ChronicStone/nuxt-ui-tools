<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { onMounted } from 'vue'

import { COUNTRIES, PRODUCTS, TEAMS, countriesQuery, productsQuery, teamsQuery } from '~/perf/data'
import type { PerfScenarioForm } from '~/perf/form'
import { PERF_SCENARIOS } from '~/perf/scenarios'
import type { PerfScenarioKey } from '~/perf/scenarios'

const props = defineProps<{
  scenario: PerfScenarioKey
  rows: number
  inert: boolean | 'auto'
  mount: number
}>()
const emit = defineEmits<{ mounted: [scenario: PerfScenarioForm] }>()

const queryClient = useQueryClient()
queryClient.setQueryData(teamsQuery.queryKey, TEAMS)
queryClient.setQueryData(countriesQuery.queryKey, COUNTRIES)
queryClient.setQueryData(productsQuery.queryKey, PRODUCTS)

const scenario = PERF_SCENARIOS[props.scenario].create({
  inert: props.inert,
  mount: props.mount,
  rows: props.rows,
})

onMounted(() => {
  Object.assign(window, { __perfForm: scenario })
  emit('mounted', scenario)
})
</script>

<template>
  <NutFormPage :form="scenario.form" class="h-full" />
</template>
