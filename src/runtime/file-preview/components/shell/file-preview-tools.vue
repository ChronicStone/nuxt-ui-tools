<script setup lang="ts">
import { useFilePreviewShell } from '../../composables/use-file-preview-shell'

/**
 * Places a renderer's buttons in the preview chrome: the header on wide screens, the bottom bar on
 * phones.
 */
const shell = useFilePreviewShell()
</script>

<template>
  <Teleport v-if="shell.tools.value" :to="shell.tools.value">
    <slot />
  </Teleport>
</template>
