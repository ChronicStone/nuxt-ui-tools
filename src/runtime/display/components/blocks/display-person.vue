<script setup lang="ts">
import UAvatar from '@nuxt/ui/components/Avatar.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { computed } from 'vue'

import { useDisplayAppUi } from '../../composables/use-display-config'
import { vRevealTruncated } from '../../directives/reveal-truncated'
import type { DisplayPerson, DisplayPersonProps, DisplayPersonSlot } from '../../types'
import { resolveDisplayClasses } from '../../utils/classes'
import { isDisplayContentEmpty, resolveDisplayText } from '../../utils/content'
import { displayLinkAttrs } from '../../utils/links'
import {
  DISPLAY_SURFACE_CLASSES,
  displayToneClass,
  initialsOf,
  toneFromName,
} from '../../utils/tone'
import DisplayChip from '../parts/display-chip.vue'
import DisplayCopy from '../parts/display-copy.vue'
import DisplayRender from '../parts/display-render'
import DisplaySkeleton from '../parts/display-skeleton.vue'

const {
  variant = 'user',
  people = undefined,
  max = 4,
  label = undefined,
  contacts = undefined,
  size = 'md',
  loading = false,
  ui = undefined,
  ...person
} = defineProps<DisplayPersonProps>()

const AVATAR_SIZES = {
  contact: { lg: '2xl', md: 'xl', sm: 'lg' },
  group: { lg: 'lg', md: 'md', sm: 'sm' },
  user: { lg: 'xl', md: 'lg', sm: 'md' },
} as const

const appUi = useDisplayAppUi('person')
const self = computed<DisplayPerson>(() => ({ ...person, name: person.name ?? '' }))
const shown = computed(() => (people ?? []).slice(0, max))
const overflow = computed(() => Math.max(0, (people?.length ?? 0) - shown.value.length))
const classes = computed(() =>
  resolveDisplayClasses<DisplayPersonSlot>(
    {
      avatar: variant === 'group' ? 'ring-2 ring-[var(--ui-bg)]' : '',
      body: 'min-w-0 flex-1',
      chip: 'shrink-0',
      contact: 'flex min-w-0 items-center gap-2 text-sm text-toned',
      contactIcon: 'size-3.5 shrink-0 text-muted',
      contactValue: 'min-w-0 flex-1 truncate',
      contacts: 'mt-3 flex flex-col gap-1',
      description: 'truncate text-xs text-muted',
      group: 'flex -space-x-2',
      label: 'text-sm text-toned',
      name: `truncate font-semibold text-highlighted ${size === 'lg' ? 'text-base' : 'text-sm'}`,
      root:
        variant === 'contact'
          ? `min-w-0 ${DISPLAY_SURFACE_CLASSES.bordered} p-3.5`
          : 'flex min-w-0 items-center gap-3',
    },
    appUi.value,
    ui,
  ),
)

function avatarOf(entry: DisplayPerson) {
  const name = resolveDisplayText(entry.name) ?? ''
  const tone = entry.tone ?? toneFromName(name)
  return {
    alt: name,
    text: initialsOf(name),
    ...entry.avatar,
    class: [displayToneClass(tone), classes.value.avatar, 'shrink-0'],
    ui: {
      fallback: 'text-[0.8em] font-semibold text-[var(--nut-tone-ink)]',
      root: 'bg-[var(--nut-tone-soft)]',
    },
  }
}
</script>

<template>
  <DisplaySkeleton v-if="loading" layout="card" />
  <div
    v-else-if="variant === 'group'"
    :class="classes.root"
    data-display="person"
    data-variant="group"
  >
    <div :class="classes.group">
      <UAvatar
        v-for="(person, index) in shown"
        :key="index"
        v-bind="avatarOf(person)"
        :size="AVATAR_SIZES.group[size]"
        :title="resolveDisplayText(person.name)"
      />
      <UAvatar
        v-if="overflow"
        :text="`+${overflow}`"
        :size="AVATAR_SIZES.group[size]"
        :class="[classes.avatar, 'nut-display-tone-neutral']"
        :ui="{ fallback: 'font-semibold text-toned', root: 'bg-elevated' }"
      />
    </div>
    <span v-if="!isDisplayContentEmpty(label)" v-reveal-truncated :class="classes.label"
      ><DisplayRender :content="label"
    /></span>
  </div>
  <div v-else :class="classes.root" data-display="person" :data-variant="variant">
    <div class="flex min-w-0 items-center gap-3">
      <UAvatar
        v-bind="avatarOf(self)"
        :size="AVATAR_SIZES[variant === 'contact' ? 'contact' : 'user'][size]"
      />
      <div :class="classes.body">
        <div v-reveal-truncated :class="classes.name">{{ resolveDisplayText(self.name) }}</div>
        <div
          v-if="!isDisplayContentEmpty(self.description)"
          v-reveal-truncated
          :class="classes.description"
        >
          <DisplayRender :content="self.description" />
        </div>
      </div>
      <DisplayChip v-if="self.chip" :chip="self.chip" :class="classes.chip" />
    </div>
    <div v-if="variant === 'contact' && contacts?.length" :class="classes.contacts">
      <div v-for="(contact, index) in contacts" :key="index" :class="classes.contact">
        <UIcon v-if="contact.icon" :name="contact.icon" :class="classes.contactIcon" />
        <ULink
          v-if="contact.href"
          v-bind="displayLinkAttrs(contact.href, contact.target)"
          v-reveal-truncated
          :class="[classes.contactValue, 'hover:text-highlighted']"
        >
          {{ contact.value }}
        </ULink>
        <span v-else v-reveal-truncated :class="classes.contactValue">{{ contact.value }}</span>
        <DisplayCopy v-if="contact.copy !== false" :value="contact.value" class="-my-1" />
      </div>
    </div>
  </div>
</template>
