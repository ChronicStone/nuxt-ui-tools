<script setup lang="ts">
import { queryOptions } from '@tanstack/vue-query'
import { ref } from 'vue'

import { defineFormSchema, useForm, useFormApi } from '#ui-tools/form'
import type { ExtractFormOutput } from '#ui-tools/form'

function sleep(duration: number) {
  return new Promise<void>(resolve => setTimeout(resolve, duration))
}

const showcaseForm = defineFormSchema({
  formKey: 'playground.form.showcase',
  title: 'Form field showcase',
  layout: {
    columns: 8,
    gap: 16,
  },
  context: {
    countries: () =>
      queryOptions({
        queryKey: ['form-showcase-countries'],
        queryFn: async () => {
          await sleep(700)

          return [
            { label: 'France', value: 'FR', description: 'Default country' },
            { label: 'Belgium', value: 'BE', description: 'Benelux' },
            { label: 'Switzerland', value: 'CH', description: 'Alpine region' },
          ]
        },
      }),
    roles: [
      { label: 'Owner', value: 'owner', description: 'Full access' },
      { label: 'Manager', value: 'manager', description: 'Operational access' },
      { label: 'Reviewer', value: 'reviewer', description: 'Read and comment' },
    ],
  },
  fields: [
    {
      key: 'intro',
      type: 'info',
      content: 'This playground is now a field and runtime showcase: context-backed options, dotted paths, transforms, validation, arrays, uploads, and live output.',
      layout: {
        span: 'full',
      },
    },
    {
      key: 'section.core',
      type: 'divider',
      label: 'Core inputs',
      layout: {
        span: 'full',
      },
    },
    {
      key: 'profile.firstName',
      type: 'text',
      label: 'First name',
      placeholder: 'Ada',
      validation: {
        required: true,
      },
    },
    {
      key: 'profile.lastName',
      type: 'text',
      label: 'Last name',
      placeholder: 'Lovelace',
      validation: {
        required: true,
      },
    },
    {
      key: 'profile.email',
      type: 'text',
      inputType: 'email',
      label: 'Email',
      placeholder: 'ada@example.com',
      transform: {
        output: value => value?.trim().toLowerCase() ?? '',
      },
      validation: {
        required: true,
        rules: [
          {
            name: 'email',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) return true
              if (typeof value !== 'string') return 'Enter a valid email address.'
              return value.includes('@') || 'Enter a valid email address.'
            },
          },
        ],
      },
    },
    {
      key: 'profile.phone',
      type: 'phone-number',
      label: 'Phone number',
      defaultCountryCode: 'FR',
      clearable: true,
      validation: {
        rules: [
          {
            name: 'phone',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) return true
              return typeof value === 'string' && value.startsWith('+') || 'Enter a valid international phone number.'
            },
          },
        ],
      },
    },
    {
      key: 'profile.birthDate',
      type: 'date',
      label: 'Localized date',
      clearable: true,
      previewFormat: {
        dateStyle: 'medium',
      },
      manualInput: {
        format: 'dd/MM/yyyy',
        placeholder: 'dd/mm/yyyy',
      },
      calendar: {
        yearRange: [1920, 2035],
      },
    },
    {
      key: 'section.options',
      type: 'divider',
      label: 'Options, context, and creation',
      layout: {
        span: 'full',
      },
    },
    {
      key: 'profile.country',
      type: 'select',
      label: 'Context select',
      searchable: true,
      options: ({ ctx }) => ctx.countries.value ?? [],
    },
    {
      key: 'profile.role',
      type: 'select',
      label: 'Rich options',
      options: ({ ctx }) => ctx.roles.value,
    },
    {
      key: 'profile.city',
      type: 'select',
      label: 'Query options depending on context',
      searchable: true,
      options: ({ ctx }) =>
        queryOptions({
          queryKey: ['form-showcase-cities', ctx.countries.value?.map(country => country.value).join(',') ?? 'loading'],
          enabled: Boolean(ctx.countries.value),
          queryFn: async () => {
            await sleep(500)

            return [
              { label: 'Paris', value: 'paris', description: 'France' },
              { label: 'Brussels', value: 'brussels', description: 'Belgium' },
              { label: 'Geneva', value: 'geneva', description: 'Switzerland' },
            ]
          },
        }),
    },
    {
      key: 'profile.skill',
      type: 'select',
      label: 'Creatable option query',
      searchable: true,
      createItem: {
        position: 'bottom',
        when: 'empty',
      },
      options: {
        source: () =>
          queryOptions({
            queryKey: ['form-showcase-skills'],
            queryFn: async () => {
              await sleep(900)

              return [
                { label: 'Frontend', value: 'frontend', description: 'Vue, Nuxt, UI systems' },
                { label: 'Product', value: 'product', description: 'Discovery and delivery' },
                { label: 'Operations', value: 'operations', description: 'Process and support' },
              ]
            },
          }),
        create: {
          handler: async ({ label }) => {
            await sleep(450)

            return {
              label,
              value: label.trim().toLowerCase().replace(/\s+/g, '-'),
              description: 'Created locally from the select menu',
            }
          },
        },
      },
    },
    {
      key: 'profile.channels',
      type: 'checkbox-group',
      label: 'Checkbox group',
      description: 'Option-based multi-selection using the same option runtime.',
      variant: 'card',
      options: [
        { label: 'Email', value: 'email', description: 'Transactional and digest messages' },
        { label: 'SMS', value: 'sms', description: 'Urgent notifications only' },
        { label: 'In-app', value: 'in-app', description: 'Product surface notifications' },
      ],
    },
    {
      key: 'refreshCountries',
      type: 'button',
      label: 'Refresh context countries',
      icon: 'i-lucide-refresh-cw',
      color: 'neutral',
      variant: 'soft',
      layout: {
        span: 'full',
      },
      onClick: async ({ api }) => {
        await api.context.refresh('countries')
      },
    },
    {
      key: 'section.layout',
      type: 'divider',
      label: 'Layout and composed fields',
      layout: {
        span: 'full',
      },
    },
    {
      key: 'settings',
      type: 'object',
      label: 'Object layout',
      description: 'Grouped fields with a nested grid and dotted state.',
      layout: {
        span: 'full',
        columns: 8,
        variant: 'card',
      },
      fields: [
        {
          key: 'seats',
          type: 'number',
          label: 'Seats',
          min: 1,
          default: 12,
        },
        {
          key: 'confidence',
          type: 'slider',
          label: 'Confidence',
          min: 0,
          max: 100,
          step: 5,
          default: 65,
          tooltip: true,
        },
        {
          key: 'tags',
          type: 'tag',
          label: 'Tags',
          placeholder: 'Add a tag',
          default: ['verified'],
        },
        {
          key: 'newsletter',
          type: 'checkbox',
          label: 'Product updates',
          default: true,
        },
        {
          key: 'autosave',
          type: 'switch',
          label: 'Autosave draft',
          description: 'Boolean switch with custom icons.',
          checkedIcon: 'i-lucide-check',
          uncheckedIcon: 'i-lucide-x',
          default: true,
        },
        {
          key: 'accentColor',
          type: 'color-picker',
          label: 'Accent color',
          default: '#00C16A',
          format: 'hex',
        },
        {
          key: 'notes',
          type: 'textarea',
          label: 'Notes',
          placeholder: 'Internal notes...',
          layout: {
            span: 'full',
          },
        },
      ],
    },
    {
      key: 'contact',
      type: 'input-group',
      label: 'Input group',
      layout: {
        span: 'full',
      },
      fields: [
        {
          key: 'contactPrefix',
          type: 'text',
          label: 'Prefix',
          default: '+33',
        },
        {
          key: 'contactNumber',
          type: 'text',
          label: 'Phone',
          placeholder: '6 12 34 56 78',
        },
      ],
    },
    {
      key: 'section.collections',
      type: 'divider',
      label: 'Collections and files',
      layout: {
        span: 'full',
      },
    },
    {
      key: 'contacts',
      type: 'array-list',
      label: 'Array list',
      description: 'Add/remove repeated object items.',
      layout: {
        span: 'full',
        columns: 2,
      },
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'Name',
        },
        {
          key: 'email',
          type: 'text',
          inputType: 'email',
          label: 'Email',
        },
      ],
    },
    {
      key: 'avatar',
      type: 'file',
      label: 'File',
      accept: 'image/*',
    },
    {
      key: 'identityDocument',
      type: 'upload',
      label: 'Upload',
      output: 'object',
      accept: 'application/pdf,image/*',
      upload: {
        handler: async ({ files }) => {
          await sleep(600)
          const file = files[0]
          if (!file) return null

          return {
            name: file.name,
            size: file.size,
            url: `https://example.test/uploads/${encodeURIComponent(file.name)}`,
          }
        },
      },
    },
    {
      key: 'section.validation',
      type: 'divider',
      label: 'Validation and transforms',
      layout: {
        span: 'full',
      },
    },
    {
      key: 'security.otp',
      type: 'one-time-code',
      label: 'One-time code',
      length: 6,
      inputType: 'number',
      placeholder: '0',
      validation: {
        rules: [
          {
            name: 'otp-length',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) return true
              return typeof value === 'string' && value.length === 6 || 'Enter the 6 digit code.'
            },
          },
        ],
      },
    },
    {
      key: 'security.password',
      type: 'password',
      label: 'Password',
      validation: {
        rules: [
          {
            name: 'password-length',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) return true
              if (typeof value !== 'string') return 'Password must be at least 8 characters.'
              return value.length >= 8 || 'Password must be at least 8 characters.'
            },
          },
        ],
      },
    },
    {
      key: 'security.confirmPassword',
      type: 'password',
      label: 'Confirm password',
      dependencies: [['security.password', 'password']],
      validation: {
        rules: [
          {
            name: 'password-confirmation',
            validate: ({ api, deps }) => {
              const value = api.value.get()
              if (!value) return true
              return value === deps.securityPassword || 'Passwords do not match.'
            },
          },
        ],
      },
      submit: {
        omit: true,
      },
    },
    {
      key: 'internalDraftId',
      type: 'hidden',
      default: 'draft_showcase_001',
      submit: {
        omit: true,
      },
    },
  ],
})

type ShowcaseOutput = ExtractFormOutput<typeof showcaseForm>

const submitted = ref<ShowcaseOutput | null>(null)
const overlayResult = ref<unknown | null>(null)
const formApi = useFormApi()
const form = useForm({
  schema: showcaseForm,
  onSubmit: async ({ formData }) => {
    await sleep(500)
    submitted.value = formData
    return { success: true, data: { savedAt: new Date().toISOString() } }
  },
})

const liveState = form.state.internal
const liveOutput = form.state.output
const contextResources = form.context
const isDirty = form.meta.isDirty
const dirtyPaths = form.meta.dirtyPaths

async function openModalForm() {
  overlayResult.value = await formApi.createForm(showcaseForm, {
    id: 'playground-showcase-modal',
    mode: 'modal',
    onSubmit: async ({ formData }) => {
      await sleep(800)
      submitted.value = formData
      return { success: true, data: { mode: 'modal', savedAt: new Date().toISOString() } }
    },
  })
}

async function openDrawerForm() {
  overlayResult.value = await formApi.createForm(showcaseForm, {
    id: 'playground-showcase-drawer',
    mode: 'drawer',
    input: {
      profile: {
        firstName: 'Grace',
        lastName: 'Hopper',
      },
    },
  })
}

async function openResponsiveForm() {
  overlayResult.value = await formApi.createForm(showcaseForm, {
    id: 'playground-showcase-responsive',
    mode: 'drawer md:modal',
    input: {
      profile: {
        firstName: 'Katherine',
        lastName: 'Johnson',
      },
    },
    onSubmit: async ({ formData }) => {
      await sleep(800)
      submitted.value = formData
      return { success: true, data: { mode: 'responsive', savedAt: new Date().toISOString() } }
    },
  })
}
</script>

<template>
  <main class="mx-auto grid w-full max-w-7xl gap-6 p-6">
    <section class="grid gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">
        Form runtime
      </h1>
      <p class="max-w-3xl text-sm text-muted">
        Field rendering, form context, query-backed options, validation, layout, overlays, and live output.
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-square" variant="soft" @click="openModalForm">
          Open modal form
        </UButton>
        <UButton icon="i-lucide-panel-right-open" variant="soft" color="neutral" @click="openDrawerForm">
          Open drawer form
        </UButton>
        <UButton icon="i-lucide-panels-top-left" variant="soft" color="neutral" @click="openResponsiveForm">
          Open responsive form
        </UButton>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div class="rounded-md border border-default bg-default p-5">
        <NutForm :form="form" />
      </div>

      <aside class="grid content-start gap-4 rounded-md border border-default bg-muted/30 p-4">
        <div class="grid gap-1">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-medium text-highlighted">
              Form state status
            </h2>
            <span class="text-xs text-muted">
              {{ isDirty ? 'Dirty' : 'Pristine' }}
            </span>
          </div>
          <p class="text-xs text-muted">
            Dirty paths: {{ dirtyPaths.length ? dirtyPaths.join(', ') : 'none' }}
          </p>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Live internal state
          </h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(liveState, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Context resources
          </h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(contextResources, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Live output
          </h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(liveOutput, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Submitted output
          </h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(submitted ?? {}, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Overlay result
          </h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(overlayResult ?? {}, null, 2) }}</pre>
        </div>
      </aside>
    </section>
  </main>
</template>
