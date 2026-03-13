<script setup lang="ts">
const { classes } = usePlaygroundAppearance()
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <section :class="classes.pageStack">
    <div :class="classes.panel">
      <div :class="classes.panelMeta">
        <UBadge color="primary" variant="soft" :label="t('pages.lab.badge')" />
      </div>

      <div :class="classes.panelCopy">
        <h2 :class="classes.panelTitle">{{ t('pages.lab.title') }}</h2>
        <p :class="classes.panelText">{{ t('pages.lab.description') }}</p>
        <p :class="classes.panelText">{{ t('pages.lab.note') }}</p>
      </div>

      <div :class="classes.footer">
        <UButton :to="localePath('/')" color="neutral" variant="outline" :label="t('pages.lab.cta')" />
      </div>
    </div>
  </section>
</template>
