<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <UCard variant="subtle" class="page-panel">
    <template #header>
      <div class="page-copy">
        <UBadge color="neutral" variant="subtle" :label="t('pages.lab.badge')" />
        <h3 class="text-balance">{{ t('pages.lab.title') }}</h3>
        <p class="text-pretty">{{ t('pages.lab.description') }}</p>
      </div>
    </template>

    <div class="page-actions">
      <UButton :to="localePath('/')" color="neutral" variant="soft">
        {{ t('pages.lab.cta') }}
      </UButton>
    </div>
  </UCard>
</template>
