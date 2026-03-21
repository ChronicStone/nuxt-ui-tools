<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USlideover from '@nuxt/ui/components/Slideover.vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import { resolveFilterPanelComponent } from './registry'

const internals = useTableInternals()
</script>

<template>
  <USlideover
    :open="internals.filterPresentation.panelOpen.value"
    side="right"
    inset
    :overlay="true"
    title="Filters"
    @update:open="
      $event ? internals.filterPresentation.openPanel() : internals.filterPresentation.closePanel()
    "
  >
    <UButton
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-funnel"
      class="shrink-0"
    >
      <span class="flex items-center gap-2">
        <span>Filters</span>
        <UBadge
          v-if="internals.filterPresentation.activePanelCount.value > 0"
          color="neutral"
          variant="subtle"
          size="sm"
          :label="String(internals.filterPresentation.activePanelCount.value)"
        />
      </span>
    </UButton>

    <template #body>
      <div class="min-h-0 overflow-y-auto">
        <div class="grid gap-5">
          <component
            :is="resolveFilterPanelComponent(definition)"
            v-for="definition in internals.filterPresentation.panelDefinitions.value"
            :key="definition.key"
            :definition="definition"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          label="Clear all"
          @click="internals.filterPresentation.clearPanelDraft()"
        />

        <UButton
          color="neutral"
          variant="subtle"
          size="sm"
          label="Apply"
          @click="internals.filterPresentation.applyPanelDraft()"
        />
      </div>
    </template>
  </USlideover>
</template>
