<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import { isNumber } from '../../../shared/utils/predicate'
import { useDisplayAppUi } from '../../composables/use-display-config'
import { useDisplayIcons } from '../../composables/use-display-icons'
import { useDisplayLocale } from '../../composables/use-display-locale'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayCodeProps, DisplayCodeSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { resolveDisplayText } from '../../utils/content'
import { tokenizeJson } from '../../utils/json'
import type { JsonTokenKind } from '../../utils/json'
import DisplayCopy from '../parts/display-copy.vue'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'block',
  value,
  language = undefined,
  label = undefined,
  icon = undefined,
  href = undefined,
  copy = true,
  visible = 4,
  maxHeight = undefined,
  loading = false,
  ui = undefined,
} = defineProps<DisplayCodeProps>()

const TOKEN_CLASSES = {
  key: 'text-[var(--nut-display-code-key)]',
  literal: 'text-[var(--nut-display-code-literal)]',
  number: 'text-[var(--nut-display-code-number)]',
  punctuation: 'text-[var(--nut-display-code-muted)]',
  space: '',
  string: 'text-[var(--nut-display-code-string)]',
} as const satisfies Record<JsonTokenKind, string>

const { t } = useDisplayLocale()
const icons = useDisplayIcons()
const appUi = useDisplayAppUi('code')
const revealed = ref<boolean>(false)

const tokens = computed(() =>
  language?.toLowerCase() === 'json' ? tokenizeJson(value) : undefined,
)
const masked = computed(() => {
  const kept = Math.max(0, Math.min(visible, value.length))
  return `${'•'.repeat(Math.max(8, value.length - kept))}${kept ? value.slice(-kept) : ''}`
})
const heading = computed(() => resolveDisplayText(label) ?? language)
const bodyStyle = computed(() =>
  maxHeight === undefined
    ? undefined
    : { maxHeight: isNumber(maxHeight) ? `${maxHeight}px` : maxHeight },
)
const classes = computed(() =>
  resolveDisplayClasses<DisplayCodeSlot>(
    {
      actions: 'flex shrink-0 items-center',
      body: 'm-0 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre',
      header:
        'flex items-center justify-between gap-2 border-b border-[var(--nut-display-code-line)] py-1 ps-3 pe-1 text-[11px] text-[var(--nut-display-code-muted)]',
      icon: 'me-1 size-3.5 shrink-0 text-muted',
      language: 'font-medium',
      root:
        variant === 'block'
          ? 'min-w-0 overflow-hidden rounded-[var(--nut-display-radius)] bg-[var(--nut-display-code-bg)] text-[var(--nut-display-code-ink)]'
          : 'flex h-9 min-w-0 items-center gap-1 rounded-[calc(var(--nut-display-radius)*0.75)] border border-accented bg-elevated ps-2.5 pe-1 font-mono text-[13px] text-default',
      value: 'min-w-0 flex-1 truncate',
    },
    appUi.value,
    ui,
  ),
)
</script>

<template>
  <DisplaySkeleton v-if="loading" :layout="variant === 'block' ? 'block' : 'lines'" :count="1" />
  <div
    v-else-if="variant === 'block'"
    :class="classes.root"
    data-display="code"
    data-variant="block"
  >
    <div v-if="heading || copy || href" :class="classes.header">
      <span :class="classes.language">{{ heading }}</span>
      <div :class="classes.actions">
        <UButton
          v-if="href"
          :to="href"
          target="_blank"
          :icon="icons.external"
          :aria-label="t('display.open')"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          class="text-[var(--nut-display-code-muted)]"
        />
        <DisplayCopy v-if="copy" :value="value" class="text-[var(--nut-display-code-muted)]" />
      </div>
    </div>
    <pre
      :class="classes.body"
      :style="bodyStyle"
    ><template v-if="tokens"><span v-for="(token, index) in tokens" :key="index" :class="TOKEN_CLASSES[token.kind]">{{ token.text }}</span></template><template v-else>{{ value }}</template></pre>
  </div>
  <div v-else :class="classes.root" data-display="code" :data-variant="variant">
    <UIcon v-if="icon" :name="icon" :class="classes.icon" />
    <span v-reveal-truncated :class="classes.value" data-display-value>{{
      variant === 'secret' && !revealed ? masked : value
    }}</span>
    <div :class="classes.actions">
      <UButton
        v-if="variant === 'secret'"
        :icon="revealed ? icons.eyeOff : icons.eye"
        :aria-label="revealed ? t('display.conceal') : t('display.reveal')"
        :aria-pressed="revealed"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        class="text-dimmed"
        @click="revealed = !revealed"
      />
      <UButton
        v-if="href"
        :to="href"
        target="_blank"
        :icon="icons.external"
        :aria-label="t('display.open')"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        class="text-dimmed"
      />
      <DisplayCopy v-if="copy" :value="value" />
    </div>
  </div>
</template>
