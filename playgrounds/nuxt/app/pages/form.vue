<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <UCard variant="subtle" class="page-panel">
    <template #header>
      <div class="page-copy">
        <UBadge color="neutral" variant="subtle" :label="t('pages.form.badge')" />
        <h3 class="text-balance">{{ t('pages.form.title') }}</h3>
        <p class="text-pretty">{{ t('pages.form.description') }}</p>
      </div>
    </template>

    <div class="page-actions">
      <UButton :to="localePath('/lab')" color="neutral" variant="soft">
        {{ t('pages.form.cta') }}
      </UButton>
    </div>
  </UCard>
</template>
