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
          <UBadge color="neutral" variant="subtle" :label="t('pages.lab.badge')" />
        </div>

        <h2 :class="classes.panelTitle">{{ t('pages.lab.title') }}</h2>
        <p :class="classes.panelText">{{ t('pages.lab.description') }}</p>
      </div>

      <div class="grid gap-3 lg:grid-cols-[auto,1fr] lg:items-end">
        <div :class="classes.mono">sandbox / theme / one-off checks</div>
        <p :class="classes.panelText">{{ t('pages.lab.note') }}</p>
      </div>

      <div :class="classes.footer">
        <UButton :to="localePath('/')" color="primary" variant="soft">
          {{ t('pages.lab.cta') }}
        </UButton>
      </div>
    </article>
  </section>
</template>
