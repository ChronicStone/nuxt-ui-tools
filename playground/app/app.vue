<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

import * as uiToolsLocales from '#ui-tools/i18n/locales'

const { locale } = useI18n()

// eslint-disable-next-line import/namespace
const lang = computed(() => locales[locale.value].code)
// eslint-disable-next-line import/namespace
const dir = computed(() => locales[locale.value].dir)

useHead({
  title: 'nuxt-ui-tools - Playground',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    {
      name: 'description',
      content: 'Interactive playground for validating nuxt-ui-tools runtime behavior and UI.',
    },
  ],
  htmlAttrs: {
    lang,
    dir,
  },
})
</script>

<template>
  <UApp :locale="locales[locale]">
    <NutToolsProvider :locale="uiToolsLocales[locale]">
      <NutFormProvider>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </NutFormProvider>
    </NutToolsProvider>
  </UApp>
</template>
