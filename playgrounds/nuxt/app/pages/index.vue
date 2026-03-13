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
        <UButton :to="localePath('/table-v2')" color="primary" :label="t('pages.overview.openPage')" />
      </div>
    </div>
  </section>
</template>
