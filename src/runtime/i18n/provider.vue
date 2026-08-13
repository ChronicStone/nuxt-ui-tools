<script setup lang="ts">
import { computed } from 'vue'

import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n/types'
import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n/use-locale'

const props = defineProps<{
  locale?: UiToolsLocale<UiToolsMessages>
}>()

provideUiToolsLocale(useUiToolsLocaleRef(computed(() => props.locale)))
</script>

<template>
  <slot />
</template>
