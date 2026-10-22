<script setup lang="ts">
import ULink from '@nuxt/ui/components/Link.vue'
import { computed } from 'vue'

import { isString } from '../../../shared/utils/predicate'
import type { DisplayFact } from '../../types'
import { displayContentText, isDisplayContentEmpty } from '../../utils/content'
import DisplayChip from './display-chip.vue'
import DisplayCopy from './display-copy.vue'
import DisplayRender from './display-render'

const { fact } = defineProps<{ fact: DisplayFact }>()

const copyValue = computed(() =>
  isString(fact.copy) ? fact.copy : fact.copy ? displayContentText(fact.value) : undefined,
)
</script>

<template>
  <span
    v-if="fact.loading"
    class="nut-dash-shimmer nut-dash-ghost inline-block h-3.5 w-20 max-w-full rounded"
    aria-busy="true"
    data-display-fact-loading
  />
  <DisplayChip v-else-if="fact.chip" :chip="fact.chip" />
  <span v-else-if="isDisplayContentEmpty(fact.value)" class="font-medium text-dimmed">—</span>
  <ULink
    v-else-if="fact.to"
    :to="fact.to"
    class="underline decoration-[var(--ui-border-accented)] underline-offset-2 hover:decoration-current"
  >
    <DisplayRender :content="fact.value" />
  </ULink>
  <DisplayRender v-else :content="fact.value" />
  <DisplayCopy v-if="copyValue && !fact.loading" :value="copyValue" class="-my-1" />
</template>
