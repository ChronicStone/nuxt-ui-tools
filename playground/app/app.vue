<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

import * as uiToolsLocales from '#ui-tools/i18n/locales'

import { renderPlaygroundMarkdown } from './lib/playground-markdown'

const { locale } = useI18n()

// eslint-disable-next-line import/namespace
const lang = computed(() => locales[locale.value].code)
// eslint-disable-next-line import/namespace
const dir = computed(() => locales[locale.value].dir)

useHead({
  htmlAttrs: {
    dir,
    lang,
  },
  meta: [
    { content: 'width=device-width, initial-scale=1', name: 'viewport' },
    {
      content: 'Interactive playground for validating nuxt-ui-tools runtime behavior and UI.',
      name: 'description',
    },
  ],
  title: 'nuxt-ui-tools - Playground',
})
</script>

<template>
  <UApp :locale="locales[locale]">
    <NutToolsProvider :locale="uiToolsLocales[locale]">
      <NutFormProvider>
        <NutFilePreviewProvider :markdown="renderPlaygroundMarkdown">
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </NutFilePreviewProvider>
      </NutFormProvider>
    </NutToolsProvider>
  </UApp>
</template>
