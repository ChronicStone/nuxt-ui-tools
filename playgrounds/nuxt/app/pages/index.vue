<script setup lang="ts">
const localePath = useLocalePath()
const { classes } = usePlaygroundAppearance()
const { t } = useI18n()

const entries = [
  {
    to: '/form',
    titleKey: 'nav.form',
    descriptionKey: 'nav.formDescription',
    color: 'primary' as const,
  },
  {
    to: '/table',
    titleKey: 'nav.table',
    descriptionKey: 'nav.tableDescription',
    color: 'neutral' as const,
  },
  {
    to: '/lab',
    titleKey: 'nav.lab',
    descriptionKey: 'nav.labDescription',
    color: 'neutral' as const,
  },
] as const
</script>

<template>
  <section :class="classes.pageStack">
    <section :class="classes.pageGrid">
      <article :class="classes.panel">
        <div :class="classes.panelMeta">
          <UBadge color="neutral" variant="subtle" :label="t('pages.overview.badge')" />
          <UBadge color="success" variant="soft" :label="t('pages.overview.status')" />
        </div>

        <div :class="classes.panelCopy">
          <h2 :class="classes.panelTitle">{{ t('pages.overview.title') }}</h2>
          <p :class="classes.panelText">{{ t('pages.overview.description') }}</p>
        </div>

        <div class="grid gap-3 lg:grid-cols-[auto,1fr] lg:items-end">
          <div :class="classes.mono">playgrounds/nuxt</div>
          <p :class="classes.panelText">{{ t('layout.sessionDescription') }}</p>
        </div>
      </article>

      <div :class="classes.list">
        <article v-for="entry in entries" :key="entry.to" :class="classes.panel">
          <div :class="classes.panelMeta">
            <UBadge :color="entry.color" variant="soft" :label="t(entry.titleKey)" />
          </div>

          <div :class="classes.panelCopy">
            <h3 class="m-0 text-xl font-semibold tracking-tight text-highlighted text-balance">
              {{ t(entry.titleKey) }}
            </h3>
            <p :class="classes.panelText">{{ t(entry.descriptionKey) }}</p>
          </div>

          <div :class="classes.footer">
            <UButton :to="localePath(entry.to)" :color="entry.color" variant="soft">
              {{ t('pages.overview.openPage') }}
            </UButton>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
