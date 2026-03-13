<script setup lang="ts">
import PlaygroundControls from './components/playground/PlaygroundControls.vue'

const { classes, headerBadges } = usePlaygroundAppearance()
const { links, route } = usePlaygroundNavigation()
const { t } = useI18n()
</script>

<template>
  <UApp>
    <div :class="classes.shell">
      <div :class="classes.container">
        <header :class="classes.header">
          <div :class="classes.headerActions">
            <div :class="classes.titleWrap">
              <div :class="classes.eyebrowRow">
                <span>{{ t('layout.brandEyebrow') }}</span>
                <span>{{ t('layout.badge') }}</span>
              </div>

              <div class="grid gap-2">
                <h1 :class="classes.title">
                  {{ t('layout.brandTitle') }}
                </h1>
                <p :class="classes.description">
                  {{ t('layout.brandDescription') }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                v-for="badge in headerBadges"
                :key="`${badge.color}-${badge.label}`"
                :color="badge.color"
                variant="soft"
                :label="badge.label"
              />
              <PlaygroundControls />
            </div>
          </div>

          <nav :class="classes.navGrid" aria-label="Playground pages">
            <ULink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              :class="[classes.navLink, route.path === link.to && classes.navLinkActive]"
            >
              <span :class="classes.navLabel">{{ t(link.key) }}</span>
              <span :class="classes.navDescription">{{ t(link.descriptionKey) }}</span>
            </ULink>
          </nav>
        </header>

        <main :class="classes.main">
          <NuxtPage />
        </main>
      </div>
    </div>
  </UApp>
</template>
