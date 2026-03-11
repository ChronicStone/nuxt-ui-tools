<script setup lang="ts">
import { LazyPlaygroundControlsPanel } from '#components'

const overlay = useOverlay()

const controlsPanel = overlay.create(LazyPlaygroundControlsPanel, {
  destroyOnClose: false,
})

const { t } = useI18n()

function openControls() {
  controlsPanel.open()
}
</script>

<template>
  <UButton
    color="neutral"
    variant="soft"
    trailing-icon="i-lucide-panel-right-open"
    @click="openControls"
  >
    {{ t('layout.controls') }}
  </UButton>
</template>
