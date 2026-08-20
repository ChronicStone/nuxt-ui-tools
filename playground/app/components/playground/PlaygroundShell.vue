<script setup lang="ts">
import { computed } from 'vue'

import { usePlaygroundNavigation } from '../../composables/usePlaygroundNavigation'
import { usePlaygroundShell } from '../../composables/usePlaygroundShell'

const { currentAbstraction, currentPage } = usePlaygroundNavigation()
const { navigationCollapsed, mobileNavigationOpen, tableSize } = usePlaygroundShell()
const showTableSize = computed(
  () => currentAbstraction.value?.id === 'table' && currentPage.value.mode !== 'document',
)
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-default text-default">
    <PlaygroundPageHeader />

    <div class="flex min-h-0 flex-1">
      <aside
        v-if="!navigationCollapsed"
        class="hidden w-64 shrink-0 overflow-y-auto border-r border-default bg-default lg:block"
      >
        <PlaygroundSidebar />
      </aside>

      <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
        <slot />
      </main>
    </div>

    <div
      v-if="mobileNavigationOpen"
      class="fixed inset-x-0 bottom-0 top-14 z-50 flex lg:hidden"
    >
      <button
        type="button"
        class="absolute inset-0 bg-default/70 backdrop-blur-[2px]"
        aria-label="Close playground navigation"
        @click="mobileNavigationOpen = false"
      />
      <aside
        class="relative h-full w-[min(19rem,calc(100vw-2rem))] overflow-y-auto border-r border-default bg-default shadow-lg"
      >
        <div class="flex h-11 items-center justify-between border-b border-default px-3">
          <span class="text-sm font-medium text-highlighted">Playground</span>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            aria-label="Close playground navigation"
            @click="mobileNavigationOpen = false"
          />
        </div>
        <div v-if="showTableSize" class="border-b border-default p-3">
          <TableSizeSelector v-model="tableSize" />
        </div>
        <PlaygroundSidebar />
      </aside>
    </div>
  </div>
</template>
