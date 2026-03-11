<script setup lang="ts">
const { currentSection, links, route } = usePlaygroundNavigation()
const { classes, headerBadges, themeUi } = usePlaygroundAppearance()
const { t } = useI18n()
</script>

<template>
  <UApp>
    <UTheme :ui="themeUi">
      <div :class="classes.shell">
        <div :class="classes.container">
          <header :class="classes.header">
            <div class="flex flex-col gap-3">
              <div :class="classes.eyebrowRow">
                <UBadge color="neutral" variant="subtle" :label="t('layout.badge')" />
                <span>{{ t('layout.brandEyebrow') }}</span>
              </div>

              <div :class="classes.titleWrap">
                <h1 :class="classes.title">
                  {{ currentSection ? t(currentSection.key) : t('layout.brandTitle') }}
                </h1>
                <p :class="classes.description">
                  {{ currentSection ? t(currentSection.descriptionKey) : t('layout.brandDescription') }}
                </p>
              </div>
            </div>

            <div :class="classes.headerActions">
              <div :class="classes.badgeRow">
                <UBadge
                  v-for="badge in headerBadges"
                  :key="badge.label"
                  :color="badge.color"
                  variant="soft"
                  :label="badge.label"
                />
              </div>

              <PlaygroundControls />
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
    </UTheme>
  </UApp>
</template>
