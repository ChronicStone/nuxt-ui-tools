<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

const { t } = useI18n()

const entries = computed(() => [
  {
    title: t('playground.home.entries.spreadsheet.title'),
    description: t('playground.home.entries.spreadsheet.description'),
    icon: 'i-lucide-file-spreadsheet',
    to: '/spreadsheet',
  },
  {
    title: t('playground.home.entries.remoteTable.title'),
    description: t('playground.home.entries.remoteTable.description'),
    icon: 'i-lucide-database-zap',
    to: '/table-remote',
  },
  {
    title: t('playground.home.entries.clientTable.title'),
    description: t('playground.home.entries.clientTable.description'),
    icon: 'i-lucide-table-properties',
    to: '/table-client',
  },
])
</script>

<template>
  <section class="grid min-h-full place-items-center px-6 py-10">
    <div class="grid w-full max-w-5xl gap-8">
      <div class="grid gap-4 text-center">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
            {{ t('playground.home.badges.home') }}
          </UBadge>
          <UBadge color="primary" variant="soft" size="sm" class="font-mono">
            {{ t('playground.home.badges.idle') }}
          </UBadge>
        </div>

        <div class="grid gap-3">
          <h1 class="text-3xl font-semibold tracking-tight text-highlighted">
            {{ t('playground.home.title') }}
          </h1>
          <p class="mx-auto max-w-3xl text-sm leading-6 text-muted">
            {{ t('playground.home.description') }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UCard
          v-for="entry in entries"
          :key="entry.to"
          class="h-full border-default/70 bg-default shadow-sm"
          :ui="{ body: 'grid h-full gap-5 p-5' }"
        >
          <div class="grid gap-4">
            <div class="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UIcon :name="entry.icon" class="size-5" />
            </div>

            <div class="grid gap-2">
              <h2 class="text-lg font-semibold text-highlighted">
                {{ entry.title }}
              </h2>
              <p class="text-sm leading-6 text-toned">
                {{ entry.description }}
              </p>
            </div>
          </div>

          <div class="mt-auto">
            <UButton
              :to="entry.to"
              color="primary"
              variant="soft"
              trailing-icon="i-lucide-arrow-right"
              :label="t('playground.common.open')"
            />
          </div>
        </UCard>
      </div>
    </div>
  </section>
</template>
