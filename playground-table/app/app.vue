<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

import * as uiToolsLocales from '#ui-tools/i18n/locales'

const { locale } = useI18n()

useHead({
  htmlAttrs: { lang: 'fr' },
  meta: [{ content: 'width=device-width, initial-scale=1, viewport-fit=cover', name: 'viewport' }],
  title: 'ExAssess · DataList playground',
})
</script>

<template>
  <UApp :locale="locales[locale as 'fr' | 'en']">
    <NutToolsProvider :locale="uiToolsLocales[locale as 'fr' | 'en']">
      <NutFormProvider>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </NutFormProvider>
    </NutToolsProvider>
  </UApp>
</template>
