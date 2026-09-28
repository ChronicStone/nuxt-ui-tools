<script setup lang="ts">
import type { PerfScenarioForm } from '~/perf/form'
import { PERF_SCENARIOS, isPerfScenarioKey } from '~/perf/scenarios'
import type { PerfScenarioKey } from '~/perf/scenarios'

const INERT_MODES = [
  { label: 'Auto', value: 'auto' },
  { label: 'Always inert', value: true },
  { label: 'Live', value: false },
] as const

const SCENARIO_ITEMS = Object.entries(PERF_SCENARIOS).map(([value, scenario]) => ({
  description: scenario.description,
  label: scenario.label,
  value,
}))

const route = useRoute()
const router = useRouter()
const scenario = ref<PerfScenarioKey>(
  isPerfScenarioKey(route.query.scenario) ? route.query.scenario : 'catalog',
)
const size = ref<number>(parseSize(route.query.size ?? route.query.rows, scenario.value))
const mounted = ref<boolean>(route.query.mount !== '0')
const inert = ref<boolean | 'auto'>(parseInert(route.query.inert))
const renderKey = ref<number>(0)
const clickedAt = ref<number | null>(mounted.value ? performance.now() : null)
const lastPaint = ref<number | null>(null)
const controls = ref<number | null>(null)
const active = shallowRef<PerfScenarioForm | null>(null)
const validating = ref<boolean>(false)
const current = computed(() => PERF_SCENARIOS[scenario.value])

watch(scenario, (next) => {
  if (!PERF_SCENARIOS[next].sizes.some((entry) => entry === size.value)) {
    size.value = PERF_SCENARIOS[next].sizes[0] ?? 1
  }
})

watch([scenario, inert, size], () => {
  renderKey.value += 1
  active.value = null
  clickedAt.value = mounted.value ? performance.now() : null
})

watch([scenario, inert, size, mounted], () => {
  void router.replace({
    query: {
      inert: inert.value === 'auto' ? undefined : inert.value ? '1' : '0',
      mount: mounted.value ? undefined : '0',
      scenario: scenario.value,
      size: String(size.value),
    },
  })
})

function parseInert(value: unknown) {
  if (value === '0') {
    return false
  }
  return value === '1' ? true : 'auto'
}

function parseSize(value: unknown, key: PerfScenarioKey) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : (PERF_SCENARIOS[key].sizes[0] ?? 1)
}

function selectScenario(value: unknown) {
  if (isPerfScenarioKey(value)) {
    scenario.value = value
  }
}

function toggleMount() {
  clickedAt.value = mounted.value ? null : performance.now()
  active.value = null
  mounted.value = !mounted.value
}

function onFormMounted(form: PerfScenarioForm) {
  active.value = form
  const start = clickedAt.value
  requestAnimationFrame(() =>
    setTimeout(() => {
      controls.value = document.querySelectorAll('[data-form-page] [data-form-field]').length
      if (start !== null) {
        lastPaint.value = Math.round(performance.now() - start)
      }
    }, 0),
  )
}

async function validateAll() {
  if (!active.value) {
    return
  }
  validating.value = true
  try {
    await active.value.validate()
  } finally {
    validating.value = false
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="grid gap-2 border-b border-default p-3">
      <div class="flex flex-wrap items-center gap-3">
        <USelect
          :model-value="scenario"
          :items="SCENARIO_ITEMS"
          class="w-60"
          data-perf-scenario
          @update:model-value="selectScenario"
        />
        <UFieldGroup>
          <UButton
            v-for="count in current.sizes"
            :key="count"
            :label="`${count}${current.unit}`"
            color="neutral"
            :variant="size === count ? 'solid' : 'outline'"
            @click="size = count"
          />
        </UFieldGroup>
        <UFieldGroup data-perf-inert>
          <UButton
            v-for="mode in INERT_MODES"
            :key="mode.label"
            :label="mode.label"
            color="neutral"
            :variant="inert === mode.value ? 'solid' : 'outline'"
            @click="inert = mode.value"
          />
        </UFieldGroup>
        <UButton
          data-perf-mount
          color="neutral"
          variant="outline"
          :label="mounted ? 'Unmount' : 'Mount'"
          @click="toggleMount"
        />
        <UButton
          data-perf-validate
          color="neutral"
          variant="outline"
          icon="i-lucide-shield-check"
          label="Validate all"
          :loading="validating"
          :disabled="!active"
          @click="validateAll"
        />
        <span v-if="lastPaint !== null" class="text-sm text-muted tabular-nums">
          Painted in {{ lastPaint }} ms<template v-if="controls !== null">
            · {{ controls }} controls</template
          >
        </span>
      </div>
      <p class="text-xs text-muted">{{ current.description }}</p>
    </div>
    <div class="min-h-0 flex-1">
      <PerfStressForm
        v-if="mounted"
        :key="renderKey"
        :scenario="scenario"
        :rows="size"
        :inert="inert"
        :mount="renderKey"
        @mounted="onFormMounted"
      />
    </div>
  </div>
</template>
