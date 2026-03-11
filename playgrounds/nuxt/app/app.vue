<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const colorMode = useColorMode()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale, t } = useI18n()

const themeModes = [
  { key: 'themeModes.light', value: 'light' as const },
  { key: 'themeModes.dark', value: 'dark' as const },
  { key: 'themeModes.system', value: 'system' as const },
] as const

const localeOptions = [
  { code: 'en' as const, label: 'locale.english' },
  { code: 'fr' as const, label: 'locale.french' },
] as const

const links = computed(() => {
  return [
    {
      to: localePath('/'),
      key: 'nav.overview',
      descriptionKey: 'nav.overviewDescription',
    },
    {
      to: localePath('/form'),
      key: 'nav.form',
      descriptionKey: 'nav.formDescription',
    },
    {
      to: localePath('/table'),
      key: 'nav.table',
      descriptionKey: 'nav.tableDescription',
    },
    {
      to: localePath('/lab'),
      key: 'nav.lab',
      descriptionKey: 'nav.labDescription',
    },
  ]
})

const currentSection = computed(() => {
  return links.value.find((link) => link.to === route.path)?.key ?? 'layout.badge'
})

function setMode(mode: 'light' | 'dark' | 'system') {
  colorMode.preference = mode
}

function setLocale(code: 'en' | 'fr') {
  const path = switchLocalePath(code)

  if (path) {
    return navigateTo(path)
  }
}
</script>

<template>
  <UApp>
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <UBadge color="neutral" variant="subtle" :label="t('layout.badge')" />
          <div>
            <p class="sidebar__eyebrow">{{ t('layout.brandEyebrow') }}</p>
            <h1 class="sidebar__title">{{ t('layout.brandTitle') }}</h1>
          </div>
        </div>

        <nav class="sidebar__nav" aria-label="Playground pages">
          <ULink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :class="{ 'nav-link--active': route.path === link.to }"
          >
            <span class="nav-link__label">{{ t(link.key) }}</span>
            <span class="nav-link__description">{{ t(link.descriptionKey) }}</span>
          </ULink>
        </nav>

        <UCard variant="soft">
          <template #header>
            <div class="card-header">
              <span>{{ t('layout.theme') }}</span>
              <UBadge color="neutral" variant="soft" :label="colorMode.value" />
            </div>
          </template>

          <div class="mode-switcher">
            <UButton
              v-for="mode in themeModes"
              :key="mode.value"
              block
              color="neutral"
              :variant="colorMode.preference === mode.value ? 'solid' : 'outline'"
              @click="setMode(mode.value)"
            >
              {{ t(mode.key) }}
            </UButton>
          </div>
        </UCard>

        <UCard variant="soft">
          <template #header>
            <div class="card-header">
              <span>{{ t('locale.label') }}</span>
              <UBadge color="info" variant="soft" :label="locale.toUpperCase()" />
            </div>
          </template>

          <div class="mode-switcher">
            <UButton
              v-for="option in localeOptions"
              :key="option.code"
              block
              color="neutral"
              :variant="locale === option.code ? 'solid' : 'outline'"
              @click="setLocale(option.code)"
            >
              {{ t(option.label) }}
            </UButton>
          </div>

          <template #footer>
            <div class="sidebar__footer">
              <p class="sidebar__meta">
                {{ t('layout.sessionDescription') }}
              </p>
              <div class="sidebar__chips">
                <UBadge color="primary" variant="soft" :label="t('layout.themeTesting')" />
                <UBadge color="neutral" variant="soft" :label="t('layout.pageRouting')" />
                <UBadge color="neutral" variant="soft" :label="t('layout.cleanBaseline')" />
              </div>
            </div>
          </template>
        </UCard>
      </aside>

      <main class="content">
        <header class="content__header">
          <div>
            <p class="content__eyebrow">{{ t('layout.currentPage') }}</p>
            <h2 class="content__title text-balance">{{ t(currentSection) }}</h2>
          </div>

          <div class="content__actions">
            <UBadge color="neutral" variant="subtle" :label="t('layout.nuxtUi')" />
            <UBadge color="neutral" variant="soft" :label="locale.toUpperCase()" />
          </div>
        </header>

        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
