<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardUi } from '../../composables/use-dashboard-ui'
import type { DashboardEmptyContent } from '../../types'
import { resolveDashboardClasses } from '../../utils/ui'

const props = defineProps<{
  kind: 'error' | 'empty'
  empty?: DashboardEmptyContent
}>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useUiToolsLocale()
const appUi = useDashboardUi()

const content = computed(() =>
  props.kind === 'error'
    ? {
        description: t('dashboard.states.errorDescription'),
        icon: 'i-lucide-cloud-alert',
        title: t('dashboard.states.error'),
      }
    : {
        description: resolveTextValue(props.empty?.description),
        icon: props.empty?.icon ?? 'i-lucide-chart-no-axes-column',
        title: resolveTextValue(props.empty?.title, t('dashboard.states.empty')),
      },
)
const classes = computed(() =>
  resolveDashboardClasses(
    {
      description: 'max-w-72 text-xs text-muted',
      icon: 'mb-1 size-6.5 text-dimmed',
      root: 'flex min-h-40 flex-col items-center justify-center gap-1 px-4 py-10 text-center',
      title: 'text-sm font-semibold text-highlighted',
    },
    appUi.value.state,
  ),
)
</script>

<template>
  <div :role="kind === 'error' ? 'alert' : undefined" :data-state="kind" :class="classes.root">
    <UIcon
      :name="content.icon"
      :class="[classes.icon, kind === 'error' && 'text-[var(--nut-dash-down)]']"
    />
    <p :class="classes.title">{{ content.title }}</p>
    <p v-if="content.description" :class="classes.description">{{ content.description }}</p>
    <UButton
      v-if="kind === 'error'"
      class="mt-2.5"
      color="neutral"
      variant="outline"
      size="xs"
      icon="i-lucide-rotate-cw"
      :label="t('dashboard.states.retry')"
      @click="emit('retry')"
    />
  </div>
</template>
