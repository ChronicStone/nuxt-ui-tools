<script setup lang="ts">
const { classes } = usePlaygroundAppearance()
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <section :class="classes.pageStack">
    <div :class="classes.panel">
      <div :class="classes.panelMeta">
        <UBadge color="primary" variant="soft" :label="t('pages.overview.badge')" />
        <UBadge color="neutral" variant="subtle" :label="t('pages.overview.status')" />
      </div>

      <div :class="classes.panelCopy">
        <h2 :class="classes.panelTitle">{{ t('pages.overview.title') }}</h2>
        <p :class="classes.panelText">{{ t('pages.overview.description') }}</p>
      </div>

      <div :class="classes.footer">
        <div class="flex flex-wrap items-center gap-2">
          <UButton :to="localePath('/table-remote')" color="primary" :label="t('pages.overview.openPage')" />
          <UButton :to="localePath('/table-client')" color="neutral" variant="outline" :label="t('pages.overview.openClientPage')" />
        </div>
      </div>
    </div>
  </section>
</template>
