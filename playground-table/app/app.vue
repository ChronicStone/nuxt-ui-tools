<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

import * as uiToolsLocales from '#ui-tools/i18n/locales'

const { locale } = useI18n()

useHead({
  htmlAttrs: { lang: 'fr' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
  title: 'ExAssess · DataList playground',
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
