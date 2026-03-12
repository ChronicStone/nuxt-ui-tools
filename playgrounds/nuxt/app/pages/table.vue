<script setup lang="ts">
import {
  tablePlaygroundRowActions,
  tablePlaygroundSchema,
  tablePlaygroundSnapshot,
} from '../composables/useTablePlaygroundSchema'

const localePath = useLocalePath()
const { classes } = usePlaygroundAppearance()
const { t } = useI18n()
const schema = tablePlaygroundSchema
const snapshot = computed(() => tablePlaygroundSnapshot)
const previewRowActions = computed(() => tablePlaygroundRowActions)

const metaItems = computed(() => [
  { label: t('pages.table.metaLabels.tableKey'), value: schema.tableKey },
  { label: t('pages.table.metaLabels.rowKey'), value: String(snapshot.value.meta.rowKey) },
  { label: t('pages.table.metaLabels.sourceMode'), value: snapshot.value.meta.mode },
  { label: t('pages.table.metaLabels.views'), value: (schema.views ?? []).join(', ') },
  {
    label: t('pages.table.metaLabels.columnCount'),
    value: String(schema.table?.columns?.length ?? 0),
  },
  {
    label: t('pages.table.metaLabels.filterCount'),
    value: String(schema.filters?.ui?.length ?? 0),
  },
  {
    label: t('pages.table.metaLabels.toolbarActions'),
    value: String(schema.toolbarActions?.length ?? 0),
  },
  { label: t('pages.table.metaLabels.bulkActions'), value: String(schema.actions?.length ?? 0) },
])

const showcase = computed(() => [
  {
    label: t('pages.table.sections.columns'),
    items: schema.table?.columns ?? [],
  },
  {
    label: t('pages.table.sections.filters'),
    items: schema.filters?.ui ?? [],
  },
  {
    label: t('pages.table.sections.context'),
    items: schema.context ?? [],
  },
  {
    label: t('pages.table.sections.pageContext'),
    items: schema.pageContext ?? [],
  },
  {
    label: t('pages.table.sections.actions'),
    items: [...(schema.actions ?? []), ...(schema.toolbarActions ?? [])],
  },
  {
    label: t('pages.table.sections.rowActions'),
    items: previewRowActions.value,
  },
])

const formatJson = (value: unknown) => JSON.stringify(value, null, 2)
</script>

<template>
  <section :class="classes.pageStack">
    <div :class="classes.pageGrid">
      <article :class="classes.panel">
        <div :class="classes.panelCopy">
          <div :class="classes.panelMeta">
            <UBadge color="primary" variant="soft" :label="t('pages.table.badge')" />
            <UBadge color="neutral" variant="subtle" :label="t('pages.table.schemaBadge')" />
            <UBadge color="neutral" variant="subtle" :label="t('pages.table.runtimeBadge')" />
            <UBadge color="neutral" variant="subtle" :label="t('pages.table.debugBadge')" />
          </div>

          <h2 :class="classes.panelTitle">{{ t('pages.table.title') }}</h2>
          <p :class="classes.panelText">{{ t('pages.table.description') }}</p>
        </div>

        <div class="grid gap-3 lg:grid-cols-[auto,1fr] lg:items-end">
          <div :class="classes.mono">schema / builders / debug snapshot</div>
          <p :class="classes.panelText">{{ t('pages.table.note') }}</p>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="item in metaItems"
            :key="item.label"
            class="rounded-lg border border-default/70 bg-elevated/40 p-3"
          >
            <div :class="classes.mono">{{ item.label }}</div>
            <div class="mt-2 text-sm font-medium text-highlighted">{{ item.value }}</div>
          </div>
        </div>

        <div :class="classes.footer">
          <UBadge color="success" variant="soft" :label="t('pages.table.statusReady')" />
          <UBadge color="warning" variant="subtle" :label="t('pages.table.statusPending')" />
          <UButton :to="localePath('/form')" color="neutral" variant="soft">
            {{ t('pages.table.cta') }}
          </UButton>
        </div>
      </article>

      <article :class="classes.panel">
        <div :class="classes.panelCopy">
          <div :class="classes.panelMeta">
            <UBadge color="neutral" variant="subtle" :label="t('pages.table.showcaseBadge')" />
          </div>
          <h3 class="text-xl font-semibold text-highlighted">
            {{ t('pages.table.featureTitle') }}
          </h3>
          <p :class="classes.panelText">{{ t('pages.table.featureDescription') }}</p>
        </div>

        <div class="grid gap-4">
          <div
            v-for="section in showcase"
            :key="section.label"
            class="rounded-lg border border-default/70 bg-elevated/35 p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div :class="classes.mono">{{ section.label }}</div>
              <UBadge color="neutral" variant="subtle" :label="String(section.items.length)" />
            </div>

            <pre class="mt-3 overflow-x-auto text-xs leading-6 text-toned">{{ formatJson(section.items) }}</pre>
          </div>
        </div>
      </article>
    </div>

    <div :class="classes.pageGrid">
      <article :class="classes.panel">
        <div :class="classes.panelCopy">
          <div :class="classes.panelMeta">
            <UBadge color="neutral" variant="subtle" :label="t('pages.table.schemaBadge')" />
          </div>
          <h3 class="text-xl font-semibold text-highlighted">
            {{ t('pages.table.schemaTitle') }}
          </h3>
          <p :class="classes.panelText">{{ t('pages.table.schemaDescription') }}</p>
        </div>

        <pre class="overflow-x-auto text-xs leading-6 text-toned">{{ formatJson(schema) }}</pre>
      </article>

      <article :class="classes.panel">
        <div :class="classes.panelCopy">
          <div :class="classes.panelMeta">
            <UBadge color="neutral" variant="subtle" :label="t('pages.table.debugBadge')" />
          </div>
          <h3 class="text-xl font-semibold text-highlighted">
            {{ t('pages.table.debugTitle') }}
          </h3>
          <p :class="classes.panelText">{{ t('pages.table.debugDescription') }}</p>
        </div>

        <pre class="overflow-x-auto text-xs leading-6 text-toned">{{ formatJson(snapshot) }}</pre>
      </article>
    </div>
  </section>
</template>
