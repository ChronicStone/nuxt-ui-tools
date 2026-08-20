<script setup lang="ts">
import { computed, ref } from 'vue'

import { defineFormSchema, useForm } from '#ui-tools/form'

const saved = ref(false)

const settingsSchema = defineFormSchema({
  formKey: 'playground.form.settings',
  title: 'Workspace settings',
  description: 'A small settings surface with grouped preferences and explicit submit state.',
  layout: {
    columns: 8,
    gap: 16,
  },
  controls: {
    dirtyCheck: true,
    syncInput: true,
    validate: true,
  },
  fields: [
    {
      key: 'workspace.name',
      type: 'text',
      label: 'Workspace name',
      placeholder: 'Design systems',
      layout: { span: 4 },
      validation: { required: true },
    },
    {
      key: 'workspace.timezone',
      type: 'select',
      label: 'Timezone',
      layout: { span: 4 },
      options: [
        { label: 'Europe/Paris', value: 'Europe/Paris' },
        { label: 'Europe/London', value: 'Europe/London' },
        { label: 'America/New_York', value: 'America/New_York' },
      ],
    },
    {
      key: 'notifications.email',
      type: 'checkbox',
      label: 'Email notifications',
      description: 'Receive summaries when an example or validation run completes.',
      layout: { span: 'full' },
      default: true,
    },
    {
      key: 'notifications.digest',
      type: 'select',
      label: 'Digest frequency',
      layout: { span: 4 },
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Never', value: 'never' },
      ],
    },
    {
      key: 'display.density',
      type: 'select',
      label: 'Display density',
      layout: { span: 4 },
      options: [
        { label: 'Comfortable', value: 'comfortable' },
        { label: 'Compact', value: 'compact' },
      ],
    },
    {
      key: 'notes',
      type: 'textarea',
      label: 'Notes',
      placeholder: 'What should this workspace demonstrate?',
      layout: { span: 'full' },
    },
  ],
})

const form = useForm({
  schema: settingsSchema,
  onSubmit: async () => {
    saved.value = true
    return { success: true }
  },
})

const statusLabel = computed(() => {
  if (form.isSubmitting.value) return 'Saving…'
  if (saved.value) return 'Saved'
  return form.isDirty.value ? 'Unsaved changes' : 'Ready'
})

function resetSettings() {
  form.reset()
  saved.value = false
}

async function submitSettings() {
  await form.submit()
}
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid gap-2">
        <p class="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Form / settings
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Workspace settings</h1>
        <p class="max-w-2xl text-sm leading-6 text-muted">
          A deliberately small settings route keeps grouped fields, defaults, dirty state, reset,
          and typed submit output easy to inspect.
        </p>
      </header>

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        <section class="min-w-0 border-y border-default py-6" aria-label="Settings form">
          <NutForm :form="form" />
        </section>

        <aside class="grid gap-4 border-t border-default pt-4 lg:border-t-0 lg:border-l lg:pl-6">
          <div class="grid gap-1">
            <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Status</span>
            <span class="text-sm font-medium text-highlighted" role="status">{{
              statusLabel
            }}</span>
          </div>
          <div class="grid gap-2">
            <UButton
              color="primary"
              :loading="form.isSubmitting.value"
              icon="i-lucide-save"
              @click="submitSettings"
            >
              Save settings
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-rotate-ccw"
              @click="resetSettings"
            >
              Reset
            </UButton>
          </div>
        </aside>
      </div>
    </section>
  </PlaygroundContent>
</template>
