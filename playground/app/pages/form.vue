<script setup lang="ts">
import { queryOptions } from '@tanstack/vue-query'
import { ref } from 'vue'

import { defineFormSchema, useForm, useFormApi } from '#ui-tools/form'
import type { ExtractFormOutput } from '#ui-tools/form'

function sleep(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

const formApi = useFormApi()

const addressOptionForm = defineFormSchema({
  formKey: 'playground.form.address-option',
  title: 'Create address option',
  layout: {
    columns: 8,
    gap: 16,
  },
  fields: [
    {
      key: 'label',
      type: 'text',
      label: 'Address label',
      placeholder: 'Paris office',
      layout: {
        span: 'full',
      },
      validation: {
        required: true,
      },
    },
    {
      key: 'city',
      type: 'text',
      label: 'City',
      placeholder: 'Paris',
      validation: {
        required: true,
      },
    },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { label: 'France', value: 'FR' },
        { label: 'Belgium', value: 'BE' },
        { label: 'Switzerland', value: 'CH' },
      ],
    },
  ],
})

const showcaseForm = defineFormSchema({
  formKey: 'playground.form.showcase',
  title: 'Form field showcase',
  layout: {
    columns: 8,
    gap: 16,
  },
  controls: {
    dirtyCheck: true,
    confirmNavOnDirty: true,
    syncInput: true,
    validate: true,
  },
  modal: {
    maxWidth: 1100,
    maxHeight: '90dvh',
  },
  drawer: {
    width: 720,
    resizable: true,
    placement: 'right',
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
      content:
        'This playground is now a field and runtime showcase: context-backed options, dotted paths, transforms, validation, arrays, uploads, and live output.',
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
        output: (value) => value?.trim().toLowerCase() ?? '',
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
              return (
                (typeof value === 'string' && value.startsWith('+')) ||
                'Enter a valid international phone number.'
              )
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
      options: {
        source: ({ ctx }) => ctx.countries.value ?? [],
        allowOptionsRefresh: true,
      },
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
      options: {
        allowOptionsRefresh: true,
        source: ({ ctx }) =>
          queryOptions({
            queryKey: [
              'form-showcase-cities',
              ctx.countries.value?.map((country) => country.value).join(',') ?? 'loading',
            ],
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
          label: 'Create skill',
          revalidateFieldOptions: ['profile.city'],
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
      key: 'profile.address',
      type: 'select',
      label: 'Explicit create action',
      description: 'Footer create opens a nested form and appends the returned option.',
      searchable: true,
      options: {
        allowOptionsRefresh: true,
        source: async () => {
          await sleep(650)

          return [
            { label: 'Paris office', value: 'addr-paris', description: 'FR' },
            { label: 'Brussels warehouse', value: 'addr-brussels', description: 'BE' },
          ]
        },
        create: {
          label: 'Add address',
          handler: async () => {
            const result = await formApi.createForm(addressOptionForm, {
              id: 'playground-address-create',
              mode: 'modal',
              onSubmit: async ({ formData }) => {
                await sleep(500)
                return { success: true, data: formData }
              },
            })
            if (!result.isCompleted) return null

            const label =
              typeof result.formData.label === 'string' && result.formData.label.trim()
                ? result.formData.label.trim()
                : 'New address'
            const city =
              typeof result.formData.city === 'string' && result.formData.city.trim()
                ? result.formData.city.trim()
                : 'Unknown city'
            const country =
              typeof result.formData.country === 'string' ? result.formData.country : 'N/A'

            return {
              label,
              value: `${label}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-'),
              description: `${city} · ${country}`,
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
      key: 'profile.assignees',
      type: 'auto-complete',
      label: 'Autocomplete',
      multiple: true,
      clearable: true,
      options: {
        allowOptionsRefresh: true,
        source: async () => {
          await sleep(450)

          return [
            { label: 'Ada Lovelace', value: 'ada', description: 'Research' },
            { label: 'Grace Hopper', value: 'grace', description: 'Engineering' },
            { label: 'Katherine Johnson', value: 'katherine', description: 'Operations' },
          ]
        },
      },
    },
    {
      key: 'profile.plan',
      type: 'radio-card',
      label: 'Radio cards',
      options: [
        { label: 'Starter', value: 'starter', description: 'Light usage' },
        { label: 'Scale', value: 'scale', description: 'Team workflows' },
      ],
    },
    {
      key: 'profile.flags',
      type: 'checkbox-card',
      label: 'Checkbox cards',
      orientation: 'horizontal',
      options: ['priority', 'audited'],
    },
    {
      key: 'profile.alerts',
      type: 'switch-group',
      label: 'Switch group',
      checkedIcon: 'i-lucide-check',
      uncheckedIcon: 'i-lucide-x',
      options: [
        { label: 'Email alerts', value: 'email' },
        { label: 'SMS alerts', value: 'sms' },
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
          key: 'priority',
          type: 'rating',
          label: 'Priority',
          default: 3,
        },
        {
          key: 'reviewTime',
          type: 'time',
          label: 'Review time',
          default: '09:30',
          minuteStep: 5,
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
          label: 'Accent color popover',
          default: '#00C16A',
          format: 'hex',
        },
        {
          key: 'inlineColor',
          type: 'color-picker',
          label: 'Inline color panel',
          default: '#7C3AED',
          display: 'inline',
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
      key: 'presentationCard',
      type: 'card',
      label: 'Card passthrough',
      description: 'Fields inside this card write at the current form level.',
      headerExtra: 'Passthrough',
      layout: {
        span: 'full',
        columns: 8,
      },
      fields: [
        {
          key: 'cardHeadline',
          type: 'text',
          label: 'Card headline',
        },
        {
          key: 'cardStatus',
          type: 'select',
          label: 'Card status',
          options: ['draft', 'ready', 'archived'],
        },
      ],
    },
    {
      key: 'twoColumnComposition',
      type: 'column',
      layout: {
        span: 'full',
      },
      fields: [
        {
          key: 'columnComment',
          type: 'textarea',
          label: 'Column passthrough',
          placeholder: 'Column field output is not nested under the column key.',
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
      description: 'Add, remove, and reorder repeated object items.',
      addItemLabel: 'Add contact',
      emptyLabel: 'No contacts yet. Add one to exercise nested dotted state.',
      itemLabel: 'Contact',
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
      key: 'milestones',
      type: 'array-tabs',
      label: 'Array tabs',
      description: 'The same repeated object model rendered as tabs.',
      addItemLabel: 'Add milestone',
      emptyLabel: 'No milestones yet.',
      itemLabel: 'Milestone',
      layout: {
        span: 'full',
        columns: 2,
      },
      fields: [
        {
          key: 'title',
          type: 'text',
          label: 'Title',
        },
        {
          key: 'dueDate',
          type: 'date',
          label: 'Due date',
          manualInput: {
            format: 'dd/MM/yyyy',
            placeholder: 'dd/mm/yyyy',
          },
        },
      ],
    },
    {
      key: 'section.v1',
      type: 'divider',
      label: 'V1 advanced fields',
      layout: { span: 'full' },
    },
    {
      key: 'schedule.startsAt',
      type: 'datetime',
      label: 'Date and time',
      clearable: true,
    },
    {
      key: 'schedule.period',
      type: 'daterange',
      label: 'Date range',
      clearable: true,
    },
    {
      key: 'schedule.months',
      type: 'monthrange',
      label: 'Month range',
    },
    {
      key: 'schedule.window',
      type: 'datetimerange',
      label: 'Date-time range',
    },
    { key: 'schedule.month', type: 'month', label: 'Month' },
    { key: 'schedule.year', type: 'year', label: 'Year', min: 2020, max: 2040 },
    {
      key: 'taxonomy.category',
      type: 'tree-select',
      label: 'Tree select',
      selectionControl: 'radio',
      searchable: true,
      showPath: true,
      options: [
        {
          key: 'engineering',
          label: 'Engineering',
          children: [
            { key: 'frontend', label: 'Frontend' },
            { key: 'backend', label: 'Backend' },
          ],
        },
        { key: 'operations', label: 'Operations' },
      ],
    },
    {
      key: 'taxonomy.path',
      type: 'cascader',
      label: 'Cascader',
      leafOnly: true,
      options: [
        {
          key: 'europe',
          label: 'Europe',
          children: [
            { key: 'france', label: 'France' },
            { key: 'belgium', label: 'Belgium' },
          ],
        },
      ],
    },
    {
      key: 'taxonomy.categories',
      type: 'tree-select',
      label: 'Checkbox tree select',
      multiple: true,
      cascade: true,
      clearable: true,
      options: [
        {
          key: 'products',
          label: 'Products',
          children: [
            { key: 'auctions', label: 'Auctions' },
            { key: 'direct-sales', label: 'Direct sales' },
          ],
        },
      ],
    },
    {
      key: 'taxonomy.scopes',
      type: 'tree',
      label: 'Checkbox tree',
      multiple: true,
      cascade: true,
      props: { defaultExpanded: ['catalog'] },
      options: [
        {
          key: 'catalog',
          label: 'Catalog',
          children: [
            { key: 'catalog.read', label: 'Read' },
            { key: 'catalog.write', label: 'Write' },
          ],
        },
      ],
    },
    {
      key: 'taxonomy.owner',
      type: 'tree',
      label: 'Radio tree',
      selectionControl: 'radio',
      props: { defaultExpanded: ['teams'] },
      options: [
        {
          key: 'teams',
          label: 'Teams',
          children: [
            { key: 'engineering', label: 'Engineering' },
            { key: 'operations', label: 'Operations' },
          ],
        },
      ],
    },
    {
      key: 'compactIdentity',
      type: 'group',
      label: 'Grouped controls',
      fields: [
        { key: 'code', type: 'text', placeholder: 'Code' },
        { key: 'region', type: 'select', options: ['EU', 'US'] },
      ],
      layout: { span: 'full' },
    },
    {
      key: 'permissions',
      type: 'matrix',
      label: 'Permission matrix',
      rows: [
        { key: 'catalog', label: 'Catalog' },
        { key: 'orders', label: 'Orders' },
        { key: 'users', label: 'Users' },
      ],
      fields: [
        { key: 'enabled', type: 'switch', label: 'Enabled' },
        { key: 'scope', type: 'select', label: 'Scope', options: ['own', 'all'] },
      ],
      layout: { span: 'full' },
    },
    {
      key: 'lineItems',
      type: 'array-table',
      label: 'Array table',
      fields: [
        { key: 'label', type: 'text', label: 'Label', validation: { required: true } },
        { key: 'quantity', type: 'number', label: 'Quantity', default: 1 },
      ],
      draggable: true,
      confirmDelete: true,
      virtualFields: { position: (index) => index + 1 },
      layout: { span: 'full' },
    },
    {
      key: 'contactMethods',
      type: 'array-variant',
      label: 'Discriminated contacts',
      variantKey: 'kind',
      variants: [
        {
          key: 'email',
          label: 'Email',
          fields: [{ key: 'address', type: 'text', label: 'Email address' }],
        },
        {
          key: 'phone',
          label: 'Phone',
          fields: [{ key: 'number', type: 'phone-number', label: 'Phone number' }],
        },
      ],
      displayMode: 'tabs',
      layout: { span: 'full' },
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
              return (typeof value === 'string' && value.length === 6) || 'Enter the 6 digit code.'
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
              const password = 'password' in deps ? deps.password : null
              return value === password || 'Passwords do not match.'
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

async function validateAndFocus() {
  await form.validate({ focus: true })
}

async function focusEmail() {
  await form.focus('profile.email')
}

async function refreshCountriesFromPanel() {
  await form.context.value.countries.refresh()
}
</script>

<template>
  <main class="mx-auto grid w-full max-w-7xl gap-6 p-6">
    <section class="grid gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">Form runtime</h1>
      <p class="max-w-3xl text-sm text-muted">
        Field rendering, form context, query-backed options, validation, layout, overlays, and live
        output.
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-square" variant="soft" @click="openModalForm">
          Open modal form
        </UButton>
        <UButton
          icon="i-lucide-panel-right-open"
          variant="soft"
          color="neutral"
          @click="openDrawerForm"
        >
          Open drawer form
        </UButton>
        <UButton
          icon="i-lucide-panels-top-left"
          variant="soft"
          color="neutral"
          @click="openResponsiveForm"
        >
          Open responsive form
        </UButton>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-md border border-default bg-default p-4">
        <h2 class="text-sm font-medium text-highlighted">Field coverage</h2>
        <p class="mt-1 text-xs text-muted">
          Core inputs, option fields, composed containers, arrays, file/upload, color, date, time,
          phone, tags, rating, and OTP.
        </p>
      </div>
      <div class="rounded-md border border-default bg-default p-4">
        <h2 class="text-sm font-medium text-highlighted">Dependencies</h2>
        <p class="mt-1 text-xs text-muted">
          City options wait on context countries, field creation can revalidate related option
          sources, and password confirmation consumes dependencies.
        </p>
      </div>
      <div class="rounded-md border border-default bg-default p-4">
        <h2 class="text-sm font-medium text-highlighted">Layout modes</h2>
        <p class="mt-1 text-xs text-muted">
          Inline, modal, drawer, responsive overlay mode, object cards, passthrough cards, input
          groups, and nested array layouts.
        </p>
      </div>
      <div class="rounded-md border border-default bg-default p-4">
        <h2 class="text-sm font-medium text-highlighted">Action API</h2>
        <p class="mt-1 text-xs text-muted">
          `useForm` exposes validation, focus, submit, reset, state, output, dirty metadata, context
          resources, and overlay creation.
        </p>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div class="rounded-md border border-default bg-default p-5">
        <NutForm :form="form" />
      </div>

      <aside class="grid content-start gap-4 rounded-md border border-default bg-muted/30 p-4">
        <div class="grid gap-2">
          <h2 class="text-sm font-medium text-highlighted">API controls</h2>
          <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <UButton
              icon="i-lucide-shield-check"
              size="sm"
              variant="soft"
              @click="validateAndFocus"
            >
              Validate + focus
            </UButton>
            <UButton
              icon="i-lucide-at-sign"
              size="sm"
              variant="soft"
              color="neutral"
              @click="focusEmail"
            >
              Focus email
            </UButton>
            <UButton
              icon="i-lucide-refresh-cw"
              size="sm"
              variant="soft"
              color="neutral"
              @click="refreshCountriesFromPanel"
            >
              Refresh context
            </UButton>
            <UButton
              icon="i-lucide-rotate-ccw"
              size="sm"
              variant="soft"
              color="neutral"
              @click="form.reset"
            >
              Reset form
            </UButton>
          </div>
        </div>

        <div class="grid gap-1">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-medium text-highlighted">Form state status</h2>
            <span class="text-xs text-muted">
              {{ isDirty ? 'Dirty' : 'Pristine' }}
            </span>
          </div>
          <p class="text-xs text-muted">
            Dirty paths: {{ dirtyPaths.length ? dirtyPaths.join(', ') : 'none' }}
          </p>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">Live internal state</h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{
            JSON.stringify(liveState, null, 2)
          }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">Context resources</h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{
            JSON.stringify(contextResources, null, 2)
          }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">Live output</h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{
            JSON.stringify(liveOutput, null, 2)
          }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">Submitted output</h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{
            JSON.stringify(submitted ?? {}, null, 2)
          }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">Overlay result</h2>
          <pre class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{
            JSON.stringify(overlayResult ?? {}, null, 2)
          }}</pre>
        </div>
      </aside>
    </section>
  </main>
</template>
