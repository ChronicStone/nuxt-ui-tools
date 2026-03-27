<script setup lang="ts">
const { t } = useI18n()
const { currentPage, navigateToPage, pageIndex, pages } = usePlaygroundNavigation()

defineShortcuts({
  j: () => navigateToPage(pageIndex.value + 1),
  k: () => navigateToPage(pageIndex.value - 1),
})
</script>

<template>
  <UDashboardNavbar
    :title="currentPage.label"
    :ui="{
      left: 'shrink-0',
      right: 'shrink overflow-x-auto py-2',
    }"
    class="border-b border-default/60 bg-default/80 backdrop-blur-xl"
  >
    <template #toggle>
      <UDashboardSidebarToggle size="sm" variant="outline" class="ring-default" />
      <UDashboardSidebarCollapse size="sm" variant="outline" class="ring-default" />
    </template>

    <template #leading>
      <UFieldGroup size="sm">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="outline"
          :disabled="pageIndex <= 0"
          class="ring-default"
          :aria-label="t('playground.nav.previousPage')"
          @click="navigateToPage(pageIndex - 1)"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="outline"
          :disabled="pageIndex === pages.length - 1 || pageIndex === -1"
          class="ring-default"
          :aria-label="t('playground.nav.nextPage')"
          @click="navigateToPage(pageIndex + 1)"
        />
      </UFieldGroup>
    </template>

    <template #right>
      <slot />
    </template>
  </UDashboardNavbar>
</template>
