<script setup lang="ts">
const localePath = useLocalePath()
const { classes } = usePlaygroundAppearance()
const { t } = useI18n()
</script>

<template>
  <section :class="classes.pageStack">
    <article :class="classes.panel">
      <div :class="classes.panelCopy">
        <div :class="classes.panelMeta">
          <UBadge color="neutral" variant="subtle" :label="t('pages.form.badge')" />
        </div>

        <h2 :class="classes.panelTitle">{{ t('pages.form.title') }}</h2>
        <p :class="classes.panelText">{{ t('pages.form.description') }}</p>
      </div>

      <div class="grid gap-3 lg:grid-cols-[auto,1fr] lg:items-end">
        <div :class="classes.mono">forms / validation / states</div>
        <p :class="classes.panelText">{{ t('pages.form.note') }}</p>
      </div>

      <div :class="classes.footer">
        <UButton :to="localePath('/lab')" color="primary" variant="soft">
          {{ t('pages.form.cta') }}
        </UButton>
      </div>
    </article>
  </section>
</template>
