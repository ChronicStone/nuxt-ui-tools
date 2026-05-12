<script setup lang="ts">
import { queryOptions } from '@tanstack/vue-query'
import { ref } from 'vue'

import { defineFormSchema, useForm } from '#ui-tools/form'
import type { ExtractFormOutput } from '#ui-tools/form'

function sleep(duration: number) {
  return new Promise<void>(resolve => setTimeout(resolve, duration))
}

const accountForm = defineFormSchema({
  formKey: 'playground.form.account',
  title: 'Account profile',
  showStepper: true,
  layout: {
    columns: 6,
    fieldSpan: 3,
    gap: 16,
  },
  context: {
    countries: () =>
      queryOptions({
        queryKey: ['form-playground-countries'],
        queryFn: async () => {
          await sleep(900)

          return [
            { label: 'France', value: 'FR' },
            { label: 'Belgium', value: 'BE' },
            { label: 'Switzerland', value: 'CH' },
          ]
        },
      }),
    roles: [
      { label: 'Owner', value: 'owner' },
      { label: 'Manager', value: 'manager' },
      { label: 'Reviewer', value: 'reviewer' },
    ],
  },
  steps: [
    {
      key: 'identity',
      title: 'Identity',
      fields: [
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
          layout: {
            span: 'full',
          },
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
          key: 'profile.preferredCountry',
          type: 'select',
          label: 'Preferred country',
          searchable: true,
          layout: {
            span: 'full',
          },
          options: ({ ctx }) => ctx.countries.value ?? [],
        },
        {
          key: 'internalDraftId',
          type: 'hidden',
          default: 'draft_profile_001',
          submit: {
            omit: true,
          },
        },
      ],
    },
    {
      key: 'organisation',
      title: 'Organisation',
      root: 'organisation',
      layout: {
        columns: 6,
        fieldSpan: 3,
      },
      fields: [
        {
          key: 'company',
          type: 'text',
          label: 'Company',
          validation: {
            required: true,
          },
        },
        {
          key: 'country',
          type: 'select',
          label: 'Country',
          searchable: true,
          options: ({ ctx }) => ctx.countries.value ?? [],
          validation: {
            required: true,
          },
        },
        {
          key: 'role',
          type: 'select',
          label: 'Role',
          options: ({ ctx }) => ctx.roles.value,
          validation: {
            required: true,
          },
        },
        {
          key: 'city',
          type: 'select',
          label: 'City catalog',
          searchable: true,
          options: ({ ctx }) =>
            queryOptions({
              queryKey: ['form-playground-cities', ctx.countries.value?.map(country => country.value).join(',') ?? 'loading'],
              enabled: Boolean(ctx.countries.value),
              queryFn: async () => {
                await sleep(500)

                return [
                  { label: 'Paris', value: 'paris' },
                  { label: 'Brussels', value: 'brussels' },
                  { label: 'Geneva', value: 'geneva' },
                ]
              },
            }),
        },
        {
          key: 'department',
          type: 'select',
          label: 'Department',
          searchable: true,
          options: {
            disableOnLoading: true,
            source: () =>
              queryOptions({
                queryKey: ['form-playground-departments'],
                queryFn: async () => {
                  await sleep(700)

                  return [
                    { label: 'Research', value: 'research' },
                    { label: 'Operations', value: 'operations' },
                    { label: 'Finance', value: 'finance' },
                  ]
                },
              }),
          },
          validation: {
            required: true,
          },
        },
        {
          key: 'seats',
          type: 'number',
          label: 'Seats',
          min: 1,
          default: 12,
        },
        {
          key: 'settings',
          type: 'object',
          label: 'Preferences',
          description: 'A nested object with its own grid.',
          layout: {
            span: 'full',
            columns: 2,
            variant: 'card',
          },
          fields: [
            {
              key: 'billingEmail',
              type: 'text',
              inputType: 'email',
              label: 'Billing email',
            },
            {
              key: 'newsletter',
              type: 'checkbox',
              label: 'Product updates',
              default: true,
            },
          ],
        },
      ],
    },
    {
      key: 'security',
      title: 'Security',
      fields: [
        {
          key: 'passwordNotice',
          type: 'info',
          content: 'The confirmation field stays in internal state and is omitted from submit output.',
          layout: {
            span: 'full',
          },
        },
        {
          key: 'password',
          type: 'password',
          label: 'Password',
          validation: {
            required: true,
          },
        },
        {
          key: 'confirmPassword',
          type: 'password',
          label: 'Confirm password',
          validation: {
            required: true,
          },
          submit: {
            omit: true,
          },
        },
        {
          key: 'divider',
          type: 'divider',
          label: 'Contact shortcut',
          layout: {
            span: 'full',
          },
        },
        {
          key: 'contact',
          type: 'input-group',
          label: 'Quick contact',
          layout: {
            span: 'full',
          },
          fields: [
            {
              key: 'phonePrefix',
              type: 'text',
              label: 'Prefix',
              default: '+33',
            },
            {
              key: 'phone',
              type: 'text',
              label: 'Phone',
            },
          ],
        },
      ],
    },
  ],
})

type AccountOutput = ExtractFormOutput<typeof accountForm>

const submitted = ref<AccountOutput | null>(null)
const form = useForm({
  schema: accountForm,
  onSubmit: ({ formData }) => {
    submitted.value = formData
    return { success: true }
  },
})

const liveState = form.state.internal
const liveOutput = form.state.output
const contextResources = form.context
const isDirty = form.meta.isDirty
const dirtyPaths = form.meta.dirtyPaths
</script>

<template>
  <main class="mx-auto grid w-full max-w-6xl gap-6 p-6">
    <section class="grid gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">
        Form runtime
      </h1>
      <p class="max-w-3xl text-sm text-muted">
        Schema-driven rendering, scoped layout, dotted paths, context-derived options, stepped roots, and output shaping.
      </p>
    </section>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
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
          <p class="text-xs text-muted">
            Raw form state before output transforms and omitted submit fields.
          </p>
          <pre class="max-h-64 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(liveState, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Context resources
          </h2>
          <p class="text-xs text-muted">
            Form-scoped data available to field callbacks.
          </p>
          <pre class="max-h-64 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(contextResources, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Live output
          </h2>
          <p class="text-xs text-muted">
            Current submitted shape with transforms, roots, and omissions applied.
          </p>
          <pre class="max-h-64 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(liveOutput, null, 2) }}</pre>
        </div>

        <div class="grid gap-1">
          <h2 class="text-sm font-medium text-highlighted">
            Submitted output
          </h2>
          <p class="text-xs text-muted">
            Hidden transport fields and confirmation values are omitted on submit.
          </p>

          <pre class="max-h-64 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted">{{ JSON.stringify(submitted ?? {}, null, 2) }}</pre>
        </div>
      </aside>
    </section>
  </main>
</template>
