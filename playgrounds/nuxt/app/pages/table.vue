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
          <UBadge color="neutral" variant="subtle" :label="t('pages.table.badge')" />
        </div>

        <h2 :class="classes.panelTitle">{{ t('pages.table.title') }}</h2>
        <p :class="classes.panelText">{{ t('pages.table.description') }}</p>
      </div>

      <div class="grid gap-3 lg:grid-cols-[auto,1fr] lg:items-end">
        <div :class="classes.mono">tables / density / filters</div>
        <p :class="classes.panelText">{{ t('pages.table.note') }}</p>
      </div>

      <div :class="classes.footer">
        <UButton :to="localePath('/form')" color="neutral" variant="soft">
          {{ t('pages.table.cta') }}
        </UButton>
      </div>
    </article>
  </section>
</template>
