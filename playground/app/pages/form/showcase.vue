<script setup lang="ts">
import ULink from '@nuxt/ui/components/Link.vue'
import { queryOptions } from '@tanstack/vue-query'
import { h, ref } from 'vue'

import { defineFormSchema, useForm, useFormApi } from '#ui-tools/form'
import type { ExtractFormOutput } from '#ui-tools/form'

import { isString } from '../../../../src/runtime/shared/utils/predicate'

function sleep(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

const formApi = useFormApi()

const addressOptionForm = defineFormSchema({
  fields: [
    {
      key: 'label',
      label: 'Address label',
      layout: {
        span: 'full',
      },
      placeholder: 'Paris office',
      type: 'text',
      validation: {
        required: true,
      },
    },
    {
      key: 'city',
      label: 'City',
      placeholder: 'Paris',
      type: 'text',
      validation: {
        required: true,
      },
    },
    {
      key: 'country',
      label: 'Country',
      options: [
        { label: 'France', value: 'FR' },
        { label: 'Belgium', value: 'BE' },
        { label: 'Switzerland', value: 'CH' },
      ],
      type: 'select',
    },
  ],
  formKey: 'playground.form.address-option',
  layout: {
    columns: 8,
    gap: 16,
  },
  title: 'Create address option',
})

const showcaseForm = defineFormSchema({
  context: {
    countries: () =>
      queryOptions({
        queryFn: async () => {
          await sleep(700)

          return [
            { description: 'Default country', label: 'France', value: 'FR' },
            { description: 'Benelux', label: 'Belgium', value: 'BE' },
            { description: 'Alpine region', label: 'Switzerland', value: 'CH' },
          ]
        },
        queryKey: ['form-showcase-countries'],
      }),
    roles: [
      { description: 'Full access', label: 'Owner', value: 'owner' },
      { description: 'Operational access', label: 'Manager', value: 'manager' },
      { description: 'Read and comment', label: 'Reviewer', value: 'reviewer' },
    ],
  },
  controls: {
    confirmNavOnDirty: true,
    dirtyCheck: true,
    syncInput: true,
    validate: true,
  },
  drawer: {
    placement: 'right',
    resizable: true,
    width: 720,
  },
  fields: [
    {
      content:
        'This playground is now a field and runtime showcase: context-backed options, dotted paths, transforms, validation, arrays, uploads, and live output.',
      key: 'intro',
      layout: {
        span: 'full',
      },
      type: 'info',
    },
    {
      key: 'section.core',
      label: 'Core inputs',
      layout: {
        span: 'full',
      },
      type: 'divider',
    },
    {
      key: 'profile.firstName',
      label: 'First name',
      placeholder: 'Ada',
      type: 'text',
      validation: {
        required: true,
      },
    },
    {
      key: 'profile.lastName',
      label: 'Last name',
      placeholder: 'Lovelace',
      type: 'text',
      validation: {
        required: true,
      },
    },
    {
      inputType: 'email',
      key: 'profile.email',
      label: 'Email',
      labelExtra: () =>
        h(ULink, { class: 'text-xs', href: 'mailto:support@example.com' }, () => 'Need help?'),
      placeholder: 'ada@example.com',
      transform: {
        output: (value) => value?.trim().toLowerCase() ?? '',
      },
      type: 'text',
      validation: {
        required: true,
        rules: [
          {
            name: 'email',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) {
                return true
              }
              if (!isString(value)) {
                return 'Enter a valid email address.'
              }
              return value.includes('@') || 'Enter a valid email address.'
            },
          },
        ],
      },
    },
    {
      clearable: true,
      defaultCountryCode: 'FR',
      key: 'profile.phone',
      label: 'Phone number',
      type: 'phone-number',
      validation: {
        rules: [
          {
            name: 'phone',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) {
                return true
              }
              return (
                (isString(value) && value.startsWith('+')) ||
                'Enter a valid international phone number.'
              )
            },
          },
        ],
      },
    },
    {
      calendar: {
        yearRange: [1920, 2035],
      },
      clearable: true,
      key: 'profile.birthDate',
      label: 'Localized date',
      manualInput: {
        format: 'dd/MM/yyyy',
        placeholder: 'dd/mm/yyyy',
      },
      previewFormat: {
        dateStyle: 'medium',
      },
      type: 'date',
    },
    {
      key: 'section.options',
      label: 'Options, context, and creation',
      layout: {
        span: 'full',
      },
      type: 'divider',
    },
    {
      key: 'profile.country',
      label: 'Context select',
      options: {
        allowOptionsRefresh: true,
        source: ({ ctx }) => ctx.countries.value ?? [],
      },
      searchable: true,
      type: 'select',
    },
    {
      key: 'profile.role',
      label: 'Rich options',
      options: ({ ctx }) => ctx.roles.value,
      type: 'select',
    },
    {
      key: 'profile.city',
      label: 'Query options depending on context',
      options: {
        allowOptionsRefresh: true,
        source: ({ ctx }) =>
          queryOptions({
            enabled: Boolean(ctx.countries.value),
            queryFn: async () => {
              await sleep(500)

              return [
                { description: 'France', label: 'Paris', value: 'paris' },
                { description: 'Belgium', label: 'Brussels', value: 'brussels' },
                { description: 'Switzerland', label: 'Geneva', value: 'geneva' },
              ]
            },
            queryKey: [
              'form-showcase-cities',
              ctx.countries.value?.map((country) => country.value).join(',') ?? 'loading',
            ],
          }),
      },
      searchable: true,
      type: 'select',
    },
    {
      createItem: {
        position: 'bottom',
        when: 'empty',
      },
      key: 'profile.skill',
      label: 'Creatable option query',
      options: {
        create: {
          handler: async ({ label }) => {
            await sleep(450)

            return {
              description: 'Created locally from the select menu',
              label,
              value: label.trim().toLowerCase().replace(/\s+/gu, '-'),
            }
          },
          label: 'Create skill',
          revalidateFieldOptions: ['profile.city'],
        },
        source: () =>
          queryOptions({
            queryFn: async () => {
              await sleep(900)

              return [
                { description: 'Vue, Nuxt, UI systems', label: 'Frontend', value: 'frontend' },
                { description: 'Discovery and delivery', label: 'Product', value: 'product' },
                { description: 'Process and support', label: 'Operations', value: 'operations' },
              ]
            },
            queryKey: ['form-showcase-skills'],
          }),
      },
      searchable: true,
      type: 'select',
    },
    {
      description: 'Footer create opens a nested form and appends the returned option.',
      key: 'profile.address',
      label: 'Explicit create action',
      options: {
        allowOptionsRefresh: true,
        create: {
          handler: async () => {
            const result = await formApi.createForm(addressOptionForm, {
              id: 'playground-address-create',
              mode: 'modal',
              onSubmit: async ({ formData }) => {
                await sleep(500)
                return { data: formData, success: true }
              },
            })
            if (!result.isCompleted) {
              return null
            }

            const label =
              isString(result.formData.label) && result.formData.label.trim()
                ? result.formData.label.trim()
                : 'New address'
            const city =
              isString(result.formData.city) && result.formData.city.trim()
                ? result.formData.city.trim()
                : 'Unknown city'
            const country = isString(result.formData.country) ? result.formData.country : 'N/A'

            return {
              description: `${city} · ${country}`,
              label,
              value: `${label}-${Date.now()}`.toLowerCase().replace(/\s+/gu, '-'),
            }
          },
          label: 'Add address',
        },
        source: async () => {
          await sleep(650)

          return [
            { description: 'FR', label: 'Paris office', value: 'addr-paris' },
            { description: 'BE', label: 'Brussels warehouse', value: 'addr-brussels' },
          ]
        },
      },
      searchable: true,
      type: 'select',
    },
    {
      description: 'Option-based multi-selection using the same option runtime.',
      key: 'profile.channels',
      label: 'Checkbox group',
      options: [
        { description: 'Transactional and digest messages', label: 'Email', value: 'email' },
        { description: 'Urgent notifications only', label: 'SMS', value: 'sms' },
        { description: 'Product surface notifications', label: 'In-app', value: 'in-app' },
      ],
      type: 'checkbox-group',
      variant: 'card',
    },
    {
      clearable: true,
      key: 'profile.assignees',
      label: 'Autocomplete',
      multiple: true,
      options: {
        allowOptionsRefresh: true,
        source: async () => {
          await sleep(450)

          return [
            { description: 'Research', label: 'Ada Lovelace', value: 'ada' },
            { description: 'Engineering', label: 'Grace Hopper', value: 'grace' },
            { description: 'Operations', label: 'Katherine Johnson', value: 'katherine' },
          ]
        },
      },
      type: 'auto-complete',
    },
    {
      key: 'profile.plan',
      label: 'Radio cards',
      options: [
        { description: 'Light usage', label: 'Starter', value: 'starter' },
        { description: 'Team workflows', label: 'Scale', value: 'scale' },
      ],
      type: 'radio-card',
    },
    {
      key: 'profile.flags',
      label: 'Checkbox cards',
      options: ['priority', 'audited'],
      orientation: 'horizontal',
      type: 'checkbox-card',
    },
    {
      checkedIcon: 'i-lucide-check',
      key: 'profile.alerts',
      label: 'Switch group',
      options: [
        { label: 'Email alerts', value: 'email' },
        { label: 'SMS alerts', value: 'sms' },
      ],
      type: 'switch-group',
      uncheckedIcon: 'i-lucide-x',
    },
    {
      color: 'neutral',
      icon: 'i-lucide-refresh-cw',
      key: 'refreshCountries',
      label: 'Refresh context countries',
      layout: {
        span: 'full',
      },
      onClick: async ({ api }) => {
        await api.context.refresh('countries')
      },
      type: 'button',
      variant: 'soft',
    },
    {
      key: 'section.layout',
      label: 'Layout and composed fields',
      layout: {
        span: 'full',
      },
      type: 'divider',
    },
    {
      description: 'Grouped fields with a nested grid and dotted state.',
      fields: [
        {
          default: 12,
          key: 'seats',
          label: 'Seats',
          min: 1,
          type: 'number',
        },
        {
          default: 65,
          key: 'confidence',
          label: 'Confidence',
          max: 100,
          min: 0,
          step: 5,
          tooltip: true,
          type: 'slider',
        },
        {
          default: 3,
          key: 'priority',
          label: 'Priority',
          type: 'rating',
        },
        {
          default: '09:30',
          key: 'reviewTime',
          label: 'Review time',
          minuteStep: 5,
          type: 'time',
        },
        {
          default: ['verified'],
          key: 'tags',
          label: 'Tags',
          placeholder: 'Add a tag',
          type: 'tag',
        },
        {
          default: true,
          key: 'newsletter',
          label: 'Product updates',
          type: 'checkbox',
        },
        {
          checkedIcon: 'i-lucide-check',
          default: true,
          description: 'Boolean switch with custom icons.',
          key: 'autosave',
          label: 'Autosave draft',
          type: 'switch',
          uncheckedIcon: 'i-lucide-x',
        },
        {
          default: '#00C16A',
          format: 'hex',
          key: 'accentColor',
          label: 'Accent color popover',
          type: 'color-picker',
        },
        {
          default: '#7C3AED',
          display: 'inline',
          format: 'hex',
          key: 'inlineColor',
          label: 'Inline color panel',
          type: 'color-picker',
        },
        {
          key: 'notes',
          label: 'Notes',
          layout: {
            span: 'full',
          },
          placeholder: 'Internal notes...',
          type: 'textarea',
        },
      ],
      key: 'settings',
      label: 'Object layout',
      layout: {
        columns: 8,
        span: 'full',
        variant: 'card',
      },
      type: 'object',
    },
    {
      fields: [
        {
          default: '+33',
          key: 'contactPrefix',
          label: 'Prefix',
          type: 'text',
        },
        {
          key: 'contactNumber',
          label: 'Phone',
          placeholder: '6 12 34 56 78',
          type: 'text',
        },
      ],
      key: 'contact',
      label: 'Input group',
      layout: {
        span: 'full',
      },
      type: 'input-group',
    },
    {
      description: 'Fields inside this card write at the current form level.',
      fields: [
        {
          key: 'cardHeadline',
          label: 'Card headline',
          type: 'text',
        },
        {
          key: 'cardStatus',
          label: 'Card status',
          options: ['draft', 'ready', 'archived'],
          type: 'select',
        },
      ],
      headerExtra: 'Passthrough',
      key: 'presentationCard',
      label: 'Card passthrough',
      layout: {
        columns: 8,
        span: 'full',
      },
      type: 'card',
    },
    {
      fields: [
        {
          key: 'columnComment',
          label: 'Column passthrough',
          placeholder: 'Column field output is not nested under the column key.',
          type: 'textarea',
        },
      ],
      key: 'twoColumnComposition',
      layout: {
        span: 'full',
      },
      type: 'column',
    },
    {
      key: 'section.collections',
      label: 'Collections and files',
      layout: {
        span: 'full',
      },
      type: 'divider',
    },
    {
      addItemLabel: 'Add contact',
      description: 'Add, remove, and reorder repeated object items.',
      emptyLabel: 'No contacts yet. Add one to exercise nested dotted state.',
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
        },
        {
          inputType: 'email',
          key: 'email',
          label: 'Email',
          type: 'text',
        },
      ],
      itemLabel: 'Contact',
      key: 'contacts',
      label: 'Array list',
      layout: {
        columns: 2,
        span: 'full',
      },
      type: 'array-list',
    },
    {
      addItemLabel: 'Add milestone',
      description: 'The same repeated object model rendered as tabs.',
      emptyLabel: 'No milestones yet.',
      fields: [
        {
          key: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          key: 'dueDate',
          label: 'Due date',
          manualInput: {
            format: 'dd/MM/yyyy',
            placeholder: 'dd/mm/yyyy',
          },
          type: 'date',
        },
      ],
      itemLabel: 'Milestone',
      key: 'milestones',
      label: 'Array tabs',
      layout: {
        columns: 2,
        span: 'full',
      },
      type: 'array-tabs',
    },
    {
      key: 'section.v1',
      label: 'V1 advanced fields',
      layout: { span: 'full' },
      type: 'divider',
    },
    {
      clearable: true,
      key: 'schedule.startsAt',
      label: 'Date and time',
      type: 'datetime',
    },
    {
      clearable: true,
      key: 'schedule.period',
      label: 'Date range',
      type: 'daterange',
    },
    {
      key: 'schedule.months',
      label: 'Month range',
      type: 'monthrange',
    },
    {
      key: 'schedule.window',
      label: 'Date-time range',
      type: 'datetimerange',
    },
    { key: 'schedule.month', label: 'Month', type: 'month' },
    { key: 'schedule.year', label: 'Year', max: 2040, min: 2020, type: 'year' },
    {
      key: 'taxonomy.category',
      label: 'Tree select',
      options: [
        {
          children: [
            { key: 'frontend', label: 'Frontend' },
            { key: 'backend', label: 'Backend' },
          ],
          key: 'engineering',
          label: 'Engineering',
        },
        { key: 'operations', label: 'Operations' },
      ],
      searchable: true,
      selectionControl: 'radio',
      showPath: true,
      type: 'tree-select',
    },
    {
      key: 'taxonomy.path',
      label: 'Cascader',
      leafOnly: true,
      options: [
        {
          children: [
            { key: 'france', label: 'France' },
            { key: 'belgium', label: 'Belgium' },
          ],
          key: 'europe',
          label: 'Europe',
        },
      ],
      type: 'cascader',
    },
    {
      cascade: true,
      clearable: true,
      key: 'taxonomy.categories',
      label: 'Checkbox tree select',
      multiple: true,
      options: [
        {
          children: [
            { key: 'auctions', label: 'Auctions' },
            { key: 'direct-sales', label: 'Direct sales' },
          ],
          key: 'products',
          label: 'Products',
        },
      ],
      type: 'tree-select',
    },
    {
      cascade: true,
      key: 'taxonomy.scopes',
      label: 'Checkbox tree',
      multiple: true,
      options: [
        {
          children: [
            { key: 'catalog.read', label: 'Read' },
            { key: 'catalog.write', label: 'Write' },
          ],
          key: 'catalog',
          label: 'Catalog',
        },
      ],
      props: { defaultExpanded: ['catalog'] },
      type: 'tree',
    },
    {
      key: 'taxonomy.owner',
      label: 'Radio tree',
      options: [
        {
          children: [
            { key: 'engineering', label: 'Engineering' },
            { key: 'operations', label: 'Operations' },
          ],
          key: 'teams',
          label: 'Teams',
        },
      ],
      props: { defaultExpanded: ['teams'] },
      selectionControl: 'radio',
      type: 'tree',
    },
    {
      fields: [
        { key: 'code', placeholder: 'Code', type: 'text' },
        { key: 'region', options: ['EU', 'US'], type: 'select' },
      ],
      key: 'compactIdentity',
      label: 'Grouped controls',
      layout: { span: 'full' },
      type: 'group',
    },
    {
      fields: [
        { key: 'enabled', label: 'Enabled', type: 'switch' },
        { key: 'scope', label: 'Scope', options: ['own', 'all'], type: 'select' },
      ],
      key: 'permissions',
      label: 'Permission matrix',
      layout: { span: 'full' },
      rows: [
        { key: 'catalog', label: 'Catalog' },
        { key: 'orders', label: 'Orders' },
        { key: 'users', label: 'Users' },
      ],
      type: 'matrix',
    },
    {
      confirmDelete: true,
      draggable: true,
      fields: [
        { key: 'label', label: 'Label', type: 'text', validation: { required: true } },
        { default: 1, key: 'quantity', label: 'Quantity', type: 'number' },
      ],
      key: 'lineItems',
      label: 'Array table',
      layout: { span: 'full' },
      type: 'array-table',
      virtualFields: { position: (index) => index + 1 },
    },
    {
      displayMode: 'tabs',
      key: 'contactMethods',
      label: 'Discriminated contacts',
      layout: { span: 'full' },
      type: 'array-variant',
      variantKey: 'kind',
      variants: [
        {
          fields: [{ key: 'address', label: 'Email address', type: 'text' }],
          key: 'email',
          label: 'Email',
        },
        {
          fields: [{ key: 'number', label: 'Phone number', type: 'phone-number' }],
          key: 'phone',
          label: 'Phone',
        },
      ],
    },
    {
      accept: 'image/*',
      key: 'avatar',
      label: 'File',
      type: 'file',
    },
    {
      accept: 'application/pdf,image/*',
      key: 'identityDocument',
      label: 'Upload',
      output: 'object',
      type: 'upload',
      upload: {
        handler: async ({ files }) => {
          await sleep(600)
          const file = files[0]
          if (!file) {
            return null
          }

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
      label: 'Validation and transforms',
      layout: {
        span: 'full',
      },
      type: 'divider',
    },
    {
      inputType: 'number',
      key: 'security.otp',
      label: 'One-time code',
      length: 6,
      placeholder: '0',
      type: 'one-time-code',
      validation: {
        rules: [
          {
            name: 'otp-length',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) {
                return true
              }
              return (isString(value) && value.length === 6) || 'Enter the 6 digit code.'
            },
          },
        ],
      },
    },
    {
      key: 'security.password',
      label: 'Password',
      type: 'password',
      validation: {
        rules: [
          {
            name: 'password-length',
            validate: ({ api }) => {
              const value = api.value.get()
              if (!value) {
                return true
              }
              if (!isString(value)) {
                return 'Password must be at least 8 characters.'
              }
              return value.length >= 8 || 'Password must be at least 8 characters.'
            },
          },
        ],
      },
    },
    {
      dependencies: [['security.password', 'password']],
      key: 'security.confirmPassword',
      label: 'Confirm password',
      submit: {
        omit: true,
      },
      type: 'password',
      validation: {
        rules: [
          {
            name: 'password-confirmation',
            validate: ({ api, deps }) => {
              const value = api.value.get()
              if (!value) {
                return true
              }
              const password = 'password' in deps ? deps.password : null
              return value === password || 'Passwords do not match.'
            },
          },
        ],
      },
    },
    {
      default: 'draft_showcase_001',
      key: 'internalDraftId',
      submit: {
        omit: true,
      },
      type: 'hidden',
    },
  ],
  formKey: 'playground.form.showcase',
  layout: {
    columns: 8,
    gap: 16,
  },
  modal: {
    maxHeight: '90dvh',
    maxWidth: 1100,
  },
  title: 'Form field showcase',
})

type ShowcaseOutput = ExtractFormOutput<typeof showcaseForm>

const submitted = ref<ShowcaseOutput | null>(null)
const overlayResult = ref<unknown | null>(null)
const form = useForm({
  onSubmit: async ({ formData, api }) => {
    await sleep(500)
    if (formData.profile.email === 'taken@example.com') {
      api.setError('profile.email', 'This email is already in use.')
      await api.focus('profile.email')
      return { success: false }
    }
    submitted.value = formData
    return { data: { savedAt: new Date().toISOString() }, success: true }
  },
  schema: showcaseForm,
})

const liveState = form.state.internal
const liveOutput = form.state.output
const contextResources = form.context
const { isDirty } = form.meta
const { dirtyPaths } = form.meta

async function openModalForm() {
  overlayResult.value = await formApi.createForm(showcaseForm, {
    id: 'playground-showcase-modal',
    mode: 'modal',
    onSubmit: async ({ formData }) => {
      await sleep(800)
      submitted.value = formData
      return { data: { mode: 'modal', savedAt: new Date().toISOString() }, success: true }
    },
  })
}

async function openDrawerForm() {
  overlayResult.value = await formApi.createForm(showcaseForm, {
    id: 'playground-showcase-drawer',
    input: {
      profile: {
        firstName: 'Grace',
        lastName: 'Hopper',
      },
    },
    mode: 'drawer',
  })
}

async function openResponsiveForm() {
  overlayResult.value = await formApi.createForm(showcaseForm, {
    id: 'playground-showcase-responsive',
    input: {
      profile: {
        firstName: 'Katherine',
        lastName: 'Johnson',
      },
    },
    mode: 'drawer md:modal',
    onSubmit: async ({ formData }) => {
      await sleep(800)
      submitted.value = formData
      return { data: { mode: 'responsive', savedAt: new Date().toISOString() }, success: true }
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
  <PlaygroundContent mode="document">
    <main class="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-2">
        <h1 class="text-2xl font-semibold text-highlighted">Form runtime</h1>
        <p class="max-w-3xl text-sm text-muted">
          Field rendering, form context, query-backed options, validation, layout, overlays, and
          live output.
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
      </header>

      <section
        class="grid gap-4 border-y border-default py-5 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Form capabilities"
      >
        <div>
          <h2 class="text-sm font-medium text-highlighted">Field coverage</h2>
          <p class="mt-1 text-xs text-muted">
            Core inputs, option fields, composed containers, arrays, file/upload, color, date, time,
            phone, tags, rating, and OTP.
          </p>
        </div>
        <div>
          <h2 class="text-sm font-medium text-highlighted">Dependencies</h2>
          <p class="mt-1 text-xs text-muted">
            City options wait on context countries, field creation can revalidate related option
            sources, and password confirmation consumes dependencies.
          </p>
        </div>
        <div>
          <h2 class="text-sm font-medium text-highlighted">Layout modes</h2>
          <p class="mt-1 text-xs text-muted">
            Inline, modal, drawer, responsive overlay mode, object cards, passthrough cards, input
            groups, and nested array layouts.
          </p>
        </div>
        <div>
          <h2 class="text-sm font-medium text-highlighted">Action API</h2>
          <p class="mt-1 text-xs text-muted">
            `useForm` exposes validation, focus, submit, reset, state, output, dirty metadata,
            context resources, and overlay creation.
          </p>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section class="min-w-0 border-y border-default py-6" aria-label="Form fields">
          <NutForm :form="form" />
        </section>

        <aside aria-label="Form runtime controls">
          <div class="grid gap-5 border-y border-default py-5">
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
              <pre
                class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted"
                >{{ JSON.stringify(liveState, null, 2) }}</pre>
            </div>

            <div class="grid gap-1">
              <h2 class="text-sm font-medium text-highlighted">Context resources</h2>
              <pre
                class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted"
                >{{ JSON.stringify(contextResources, null, 2) }}</pre>
            </div>

            <div class="grid gap-1">
              <h2 class="text-sm font-medium text-highlighted">Live output</h2>
              <pre
                class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted"
                >{{ JSON.stringify(liveOutput, null, 2) }}</pre>
            </div>

            <div class="grid gap-1">
              <h2 class="text-sm font-medium text-highlighted">Submitted output</h2>
              <pre
                class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted"
                >{{ JSON.stringify(submitted ?? {}, null, 2) }}</pre>
            </div>

            <div class="grid gap-1">
              <h2 class="text-sm font-medium text-highlighted">Overlay result</h2>
              <pre
                class="max-h-72 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted"
                >{{ JSON.stringify(overlayResult ?? {}, null, 2) }}</pre>
            </div>
          </div>
        </aside>
      </section>
    </main>
  </PlaygroundContent>
</template>
