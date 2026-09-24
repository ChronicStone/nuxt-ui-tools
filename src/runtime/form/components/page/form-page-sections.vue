<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFormPageContext } from '../../composables/use-form-page'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormPageSectionState } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'
import FormPageSection from './form-page-section.vue'

/**
 * Cards of a form page, one per visible section, each with its title, description, fields, and,
 * with `controls.dirtyCheck`, a ring and a reset button while it is modified. Skeleton cards
 * stand in while the schema context loads.
 */
defineSlots<{
  /** Extra buttons in a section header, before its reset button. */
  actions?: (props: { section: FormPageSectionState }) => unknown
}>()

const page = useFormPageContext()
const formUi = useFormUi()
const { t } = useUiToolsLocale()
const pageUi = computed(() => formUi.ui.value.page?.ui)
const { contextError, contextLoading, contextPending, refreshContext } = page.root
</script>

<template>
  <div
    :class="mergeFormUiClass('flex min-w-0 flex-col gap-[18px]', pageUi?.sections)"
    data-form-page-sections
  >
    <UAlert
      v-if="contextError"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="t('form.states.contextError.title')"
      :description="contextError"
    >
      <template #actions>
        <UButton
          type="button"
          color="error"
          variant="outline"
          size="xs"
          :loading="contextLoading"
          @click="refreshContext"
        >
          {{ t('form.states.contextError.action') }}
        </UButton>
      </template>
    </UAlert>
    <template v-if="contextPending">
      <div
        v-for="section in page.sections.value"
        :key="section.key"
        :class="
          mergeFormUiClass(
            'grid gap-4 rounded-xl border border-default bg-default px-6 pt-[22px] pb-6',
            pageUi?.sectionSkeleton,
          )
        "
        data-form-skeleton
      >
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-9 w-full" />
        <USkeleton class="h-9 w-2/3" />
      </div>
    </template>
    <template v-else>
      <FormPageSection
        v-for="item in page.items.value"
        :key="item.section.key"
        :entry="item.entry"
        :section="item.section"
      >
        <template v-if="$slots.actions" #actions="slotProps">
          <slot name="actions" v-bind="slotProps" />
        </template>
      </FormPageSection>
    </template>
  </div>
</template>
