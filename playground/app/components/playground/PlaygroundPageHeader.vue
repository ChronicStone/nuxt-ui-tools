<script setup lang="ts">
import { computed } from 'vue'

import { usePlaygroundNavigation } from '../../composables/usePlaygroundNavigation'
import { usePlaygroundShell } from '../../composables/usePlaygroundShell'

const { currentAbstraction, currentPage, currentTrail, route } = usePlaygroundNavigation()
const { navigationCollapsed, mobileNavigationOpen, tableSize } = usePlaygroundShell()
const { locale, setLocale } = useI18n()

const alternateLocale = computed(() => (locale.value === 'fr' ? 'en' : 'fr'))
const alternateLocaleLabel = computed(() => alternateLocale.value.toUpperCase())
const parentLabel = computed(() => {
  if (!currentAbstraction.value) return 'Playground'
  if (!currentTrail.value.length) return currentAbstraction.value.label

  const parent = currentTrail.value.at(-2)
  return parent?.label ?? currentAbstraction.value.label
})
const showTableSize = computed(
  () => currentAbstraction.value?.id === 'table' && currentPage.value.mode !== 'document',
)

async function toggleLocale() {
  await setLocale(alternateLocale.value)
}
</script>

<template>
  <header class="z-40 h-14 shrink-0 border-b border-default bg-default">
    <div class="flex h-full min-w-0 items-center gap-2 px-3 sm:px-4">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-panel-left"
        aria-label="Toggle playground navigation"
        class="hidden shrink-0 lg:inline-flex"
        @click="navigationCollapsed = !navigationCollapsed"
      />
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-menu"
        aria-label="Open playground navigation"
        class="shrink-0 lg:hidden"
        @click="mobileNavigationOpen = true"
      />

      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-2 text-highlighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="nuxt-ui-tools playground home"
      >
        <span class="grid size-7 place-items-center rounded-md bg-inverted text-inverted">
          <UIcon name="i-lucide-box" class="size-4" />
        </span>
        <span class="hidden text-sm font-semibold tracking-tight xl:inline">nuxt-ui-tools</span>
      </NuxtLink>

      <span class="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-dimmed">
          {{ parentLabel }}
        </p>
        <p class="truncate text-sm font-medium text-highlighted" :title="currentPage.description">
          {{ currentPage.label }}
        </p>
      </div>

      <TableSizeSelector v-if="showTableSize" v-model="tableSize" class="hidden sm:flex" />

      <div class="flex shrink-0 items-center gap-0.5">
        <UButton
          v-if="currentAbstraction && route.path !== currentAbstraction.path"
          :to="currentAbstraction.path"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-layout-list"
          :aria-label="`${currentAbstraction.label} overview`"
          class="hidden md:inline-flex"
        />
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :label="alternateLocaleLabel"
          :aria-label="`Switch to ${alternateLocaleLabel}`"
          @click="toggleLocale"
        />
        <UColorModeButton
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Toggle color mode"
        />
      </div>
    </div>
  </header>
</template>
