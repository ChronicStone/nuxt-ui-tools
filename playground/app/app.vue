<script setup lang="ts">
const { locale } = useI18n()

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
    lang: computed(() => locale.value),
  },
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
