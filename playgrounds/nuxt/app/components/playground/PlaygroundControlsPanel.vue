<script setup lang="ts">
const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  classes,
  currentMode,
  currentTheme,
  densityOptions,
  exportConfigPreview,
  locale,
  localeOptions,
  neutralOptions,
  previous,
  previousNeutral,
  previousPrimary,
  previousRadius,
  primaryOptions,
  radiusOptions,
  selectedNeutral,
  selectedPrimary,
  selectedRadius,
  setDensityMode,
  setLanguage,
  setMode,
  setNeutralPalette,
  setPrimaryPalette,
  setRadiusMode,
  setSurfaceMode,
  slideoverUi,
  surfaceOptions,
  themeModes,
  resetAppearance,
} = usePlaygroundAppearance()

const { t } = useI18n()

function onOpenChange(value: boolean) {
  if (!value) {
    emit('close')
  }
}
</script>

<template>
  <USlideover
    :open="props.open"
    side="right"
    inset
    :overlay="true"
    :ui="slideoverUi"
    :title="t('layout.appearance')"
    :description="t('layout.controlsDescription')"
    @update:open="onOpenChange"
  >
    <template #body>
      <div class="h-full overflow-y-auto p-4 sm:p-5">
        <div :class="[classes.controlsWrap]">
          <div class="flex items-center justify-end">
            <UButton color="neutral" variant="ghost" size="sm" @click="resetAppearance">
              {{ t('layout.resetAppearance') }}
            </UButton>
          </div>

          <div class="grid gap-6">
            <section class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <p :class="classes.fieldLabel">{{ t('layout.primaryTone') }}</p>
                <UBadge color="primary" variant="soft" :label="selectedPrimary.label" />
              </div>

              <div :class="classes.choiceGrid">
                <UButton
                  v-for="option in primaryOptions"
                  :key="option.value"
                  :color="currentTheme.primary === option.value ? 'primary' : 'neutral'"
                  :variant="currentTheme.primary === option.value ? 'soft' : 'ghost'"
                  :class="[
                    classes.toneButton,
                    currentTheme.primary === option.value && classes.toneButtonActive,
                  ]"
                  @click="setPrimaryPalette(option.value)"
                >
                  <span class="flex items-center gap-3">
                    <span
                      :class="[
                        'size-3 rounded-full ring-1 ring-inset ring-white/25',
                        option.swatch,
                      ]"
                    />
                    <span>{{ option.label }}</span>
                  </span>
                </UButton>
              </div>
            </section>

            <section class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <p :class="classes.fieldLabel">{{ t('layout.neutralTone') }}</p>
                <UBadge color="neutral" variant="soft" :label="selectedNeutral.label" />
              </div>

              <div :class="classes.neutralGrid">
                <UButton
                  v-for="option in neutralOptions"
                  :key="option.value"
                  color="neutral"
                  :variant="currentTheme.neutral === option.value ? 'soft' : 'ghost'"
                  :class="[
                    classes.toneButton,
                    currentTheme.neutral === option.value && classes.toneButtonActive,
                  ]"
                  @click="setNeutralPalette(option.value)"
                >
                  <span class="flex items-center gap-3">
                    <span
                      :class="[
                        'size-3 rounded-full ring-1 ring-inset ring-white/25',
                        option.swatch,
                      ]"
                    />
                    <span>{{ option.label }}</span>
                  </span>
                </UButton>
              </div>
            </section>

            <section class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <p :class="classes.fieldLabel">{{ t('layout.radius') }}</p>
                <UBadge color="neutral" variant="soft" :label="selectedRadius.label" />
              </div>

              <div :class="classes.radiusGrid">
                <UButton
                  v-for="option in radiusOptions"
                  :key="option.value"
                  color="neutral"
                  :variant="currentTheme.radius === option.value ? 'soft' : 'ghost'"
                  :class="[
                    classes.modeButton,
                    'justify-center',
                    currentTheme.radius === option.value && classes.modeButtonActive,
                  ]"
                  @click="setRadiusMode(option.value)"
                >
                  {{ option.label }}
                </UButton>
              </div>
            </section>

            <section class="grid gap-3">
              <p :class="classes.fieldLabel">{{ t('layout.colorMode') }}</p>

              <div :class="classes.modeGrid">
                <UButton
                  v-for="mode in themeModes"
                  :key="mode.value"
                  color="neutral"
                  :variant="currentMode === mode.value ? 'soft' : 'ghost'"
                  :icon="mode.icon"
                  :class="[
                    classes.modeButton,
                    currentMode === mode.value && classes.modeButtonActive,
                  ]"
                  @click="setMode(mode.value)"
                >
                  {{ t(mode.key) }}
                </UButton>
              </div>
            </section>

            <div :class="classes.controlsGrid">
              <div :class="classes.field">
                <label :class="classes.fieldLabel">{{ t('locale.label') }}</label>
                <USelectMenu
                  :items="localeOptions"
                  :model-value="locale"
                  value-key="value"
                  label-key="label"
                  color="neutral"
                  variant="subtle"
                  :search-input="false"
                  class="w-full"
                  @update:model-value="setLanguage"
                />
              </div>

              <div :class="classes.field">
                <label :class="classes.fieldLabel">{{ t('layout.surface') }}</label>
                <USelectMenu
                  :items="
                    surfaceOptions.map((option) => ({ label: t(option.key), value: option.value }))
                  "
                  :model-value="currentTheme.surface"
                  value-key="value"
                  label-key="label"
                  color="neutral"
                  variant="subtle"
                  :search-input="false"
                  class="w-full"
                  @update:model-value="setSurfaceMode"
                />
              </div>

              <div :class="[classes.field, classes.controlsWide]">
                <label :class="classes.fieldLabel">{{ t('layout.density') }}</label>
                <USelectMenu
                  :items="
                    densityOptions.map((option) => ({ label: t(option.key), value: option.value }))
                  "
                  :model-value="currentTheme.density"
                  value-key="value"
                  label-key="label"
                  color="neutral"
                  variant="subtle"
                  :search-input="false"
                  class="w-full"
                  @update:model-value="setDensityMode"
                />
              </div>
            </div>

            <section :class="classes.historyGrid">
              <div :class="classes.historyCard">
                <p :class="classes.fieldLabel">{{ t('layout.currentSelection') }}</p>
                <div :class="classes.previewRow">
                  <UBadge color="primary" variant="soft" :label="selectedPrimary.label" />
                  <UBadge color="neutral" variant="soft" :label="selectedNeutral.label" />
                  <UBadge color="neutral" variant="subtle" :label="selectedRadius.label" />
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    :label="t(`themeModes.${currentMode}`)"
                  />
                </div>
              </div>

              <div :class="classes.historyCard">
                <p :class="classes.fieldLabel">{{ t('layout.previousSelection') }}</p>
                <div :class="classes.previewRow">
                  <UBadge color="primary" variant="soft" :label="previousPrimary.label" />
                  <UBadge color="neutral" variant="soft" :label="previousNeutral.label" />
                  <UBadge color="neutral" variant="subtle" :label="previousRadius.label" />
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    :label="t(`themeModes.${previous.mode}`)"
                  />
                </div>
              </div>
            </section>

            <section class="grid gap-3">
              <p :class="classes.fieldLabel">{{ t('layout.exportConfig') }}</p>
              <UTextarea
                readonly
                autoresize
                :rows="9"
                :model-value="exportConfigPreview"
                :class="classes.exportBox"
              />
            </section>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
