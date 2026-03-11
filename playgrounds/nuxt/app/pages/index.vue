<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()

const entries = [
  {
    to: '/form',
    titleKey: 'nav.form',
    descriptionKey: 'nav.formDescription',
  },
  {
    to: '/table',
    titleKey: 'nav.table',
    descriptionKey: 'nav.tableDescription',
  },
  {
    to: '/lab',
    titleKey: 'nav.lab',
    descriptionKey: 'nav.labDescription',
  },
] as const
</script>

<template>
  <section class="page-grid">
    <UCard variant="subtle" class="page-hero">
      <template #header>
        <div class="card-header">
          <UBadge color="neutral" variant="subtle" :label="t('pages.overview.badge')" />
          <UBadge color="success" variant="soft" :label="t('pages.overview.status')" />
        </div>
      </template>

      <div class="page-copy">
        <h3 class="text-balance">{{ t('pages.overview.title') }}</h3>
        <p class="text-pretty">{{ t('pages.overview.description') }}</p>
      </div>
    </UCard>

    <div class="page-grid page-grid--tiles">
      <UCard v-for="entry in entries" :key="entry.to" variant="soft">
        <template #header>
          <div class="page-copy">
            <h3>{{ t(entry.titleKey) }}</h3>
            <p class="text-pretty">{{ t(entry.descriptionKey) }}</p>
          </div>
        </template>

        <UButton :to="localePath(entry.to)" color="neutral" variant="soft">
          {{ t('pages.overview.openPage') }}
        </UButton>
      </UCard>
    </div>
  </section>
</template>
