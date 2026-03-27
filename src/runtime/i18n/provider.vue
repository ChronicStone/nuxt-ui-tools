<script setup lang="ts">
import { computed } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n/use-locale'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n/types'

const props = defineProps<{
  locale?: UiToolsLocale<UiToolsMessages>
}>()

provideUiToolsLocale(useUiToolsLocaleRef(computed(() => props.locale)))
</script>

<template>
  <slot />
</template>
