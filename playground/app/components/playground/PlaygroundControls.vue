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
    variant="ghost"
    icon="i-lucide-swatch-book"
    class="data-[state=open]:bg-elevated"
    :aria-label="t('layout.controls')"
    @click="openControls"
  />
</template>
