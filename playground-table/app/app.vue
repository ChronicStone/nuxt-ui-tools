<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

import * as uiToolsLocales from '#ui-tools/i18n/locales'

const { locale } = useI18n()

useHead({
  title: 'ExAssess · DataList playground',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
  htmlAttrs: { lang: 'fr' },
})
</script>

<template>
  <UApp :locale="locales[locale as 'fr' | 'en']">
    <NutToolsProvider :locale="uiToolsLocales[locale as 'fr' | 'en']">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </NutToolsProvider>
  </UApp>
</template>
