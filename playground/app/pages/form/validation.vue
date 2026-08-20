<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { queryOptions } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

import { defineFormSchema, useForm } from '#ui-tools/form'

import { isString } from '../../../../src/runtime/shared/utils/predicate'

function sleep(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

const handleValidationState = ref<'idle' | 'pending' | 'available' | 'taken'>('idle')
const submitState = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const submitMessage = ref('Submit the form to exercise the server-like lifecycle.')
const lastSubmitted = ref<unknown | null>(null)
const lastValidation = ref<'idle' | 'valid' | 'invalid'>('idle')

const validationSchema = defineFormSchema({
  formKey: 'playground.form.validation-assessment',
  title: 'Validation assessment',
  showStepper: true,
  layout: {
    columns: 1,
    gap: 16,
  },
  controls: {
    autoFocus: true,
    syncInput: true,
    validate: true,
  },
  context: {
    teams: () =>
      queryOptions({
        queryKey: ['form-validation-teams'],
        queryFn: async () => {
          await sleep(650)
          return [
            { label: 'Design systems', value: 'design-systems', description: 'UI foundations' },
            { label: 'Platform', value: 'platform', description: 'Shared runtime services' },
            { label: 'Operations', value: 'operations', description: 'Customer workflows' },
          ]
        },
      }),
  },
  steps: [
    {
      key: 'identity',
      title: 'Identity',
      description: 'Required fields and an async uniqueness rule.',
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'Full name',
          placeholder: 'Ada Lovelace',
          validation: {
            required: true,
          },
        },
        {
          key: 'email',
          type: 'text',
          inputType: 'email',
          label: 'Email',
          placeholder: 'ada@example.com',
          validation: {
            required: true,
            rules: [
              {
                name: 'email-format',
                validate: ({ api }) => {
                  const value = api.value.get()
                  if (!value) return true
                  return (isString(value) && value.includes('@')) || 'Use a valid email.'
                },
              },
            ],
          },
        },
        {
          key: 'handle',
          type: 'text',
          label: 'Workspace handle',
          placeholder: 'ada-lovelace',
          description: 'Try “taken” or “admin” to see the async rule fail.',
          validation: {
            required: true,
            trigger: 'input',
            rules: [
              {
                name: 'handle-availability',
                validate: async ({ api }) => {
                  const value = api.value.get()
                  if (!value) {
                    handleValidationState.value = 'idle'
                    return true
                  }

                  handleValidationState.value = 'pending'
                  await sleep(950)
                  const handle = isString(value) ? value.trim().toLowerCase() : ''
                  const available = !['taken', 'admin'].includes(handle)
                  handleValidationState.value = available ? 'available' : 'taken'
                  return available || 'That handle is reserved.'
                },
              },
            ],
          },
        },
      ],
    },
    {
      key: 'security',
      title: 'Security',
      description: 'Cross-field confirmation and a query-backed select.',
      fields: [
        {
          key: 'password',
          type: 'password',
          label: 'Password',
          validation: {
            required: true,
            rules: [
              {
                name: 'password-length',
                validate: ({ api }) => {
                  const value = api.value.get()
                  if (!value) return true
                  return (isString(value) && value.length >= 8) || 'Use at least 8 characters.'
                },
              },
            ],
          },
        },
        {
          key: 'confirmPassword',
          type: 'password',
          label: 'Confirm password',
          dependencies: [['password', 'password']],
          validation: {
            required: true,
            rules: [
              {
                name: 'password-match',
                validate: ({ api, deps }) => {
                  const value = api.value.get()
                  if (!value) return true
                  const password = 'password' in deps ? deps.password : null
                  return value === password || 'Passwords must match.'
                },
              },
            ],
          },
        },
        {
          key: 'team',
          type: 'select',
          label: 'Team',
          searchable: true,
          options: {
            source: ({ ctx }) => ctx.teams.value ?? [],
            allowOptionsRefresh: true,
          },
          validation: {
            required: true,
          },
        },
      ],
    },
  ],
})

const form = useForm({
  schema: validationSchema,
  onSubmit: async ({ formData, api }) => {
    submitState.value = 'pending'
    submitMessage.value = 'Checking the server…'
    await sleep(900)

    if (formData.email === 'taken@example.com') {
      api.setError('email', 'This email is already registered.')
      submitState.value = 'error'
      submitMessage.value = 'The server rejected this email. Correct it and submit again.'
      return { success: false }
    }

    lastSubmitted.value = formData
    submitState.value = 'success'
    submitMessage.value = 'Saved successfully through the form submit lifecycle.'
    return { success: true, data: { savedAt: new Date().toISOString() } }
  },
})

const teamContext = computed(() => form.context.value.teams)

async function validateAll() {
  lastValidation.value = (await form.validate({ focus: true })) ? 'valid' : 'invalid'
}

async function validateCurrentStep() {
  lastValidation.value = (await form.validation.validateCurrentStep({ focus: true }))
    ? 'valid'
    : 'invalid'
}

async function submitForm() {
  await form.submit()
}

async function retryTeams() {
  await teamContext.value?.refresh()
}

function resetForm() {
  form.reset()
  handleValidationState.value = 'idle'
  submitState.value = 'idle'
  lastValidation.value = 'idle'
  submitMessage.value = 'Submit the form to exercise the server-like lifecycle.'
  lastSubmitted.value = null
}
</script>

<template>
  <PlaygroundContent mode="document">
    <main class="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
            Form validation lab
          </h1>
          <UBadge color="primary" variant="subtle" label="Regle-backed" />
        </div>
        <p class="max-w-3xl text-sm text-muted">
          A focused manual assessment for required rules, async validation, cross-field
          dependencies, step-scoped navigation, submit prevention, reset, and context refresh.
        </p>
      </header>

      <section
        class="grid gap-4 border-y border-default py-5 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Validation coverage"
      >
        <div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-medium text-highlighted">Sync rules</h2>
              <p class="mt-1 text-xs text-muted">Required, email format, and password length.</p>
            </div>
            <UIcon name="i-lucide-check-check" class="size-5 text-primary" />
          </div>
        </div>
        <div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-medium text-highlighted">Cross-field</h2>
              <p class="mt-1 text-xs text-muted">Confirmation reads the password dependency.</p>
            </div>
            <UIcon name="i-lucide-git-compare" class="size-5 text-primary" />
          </div>
        </div>
        <div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-medium text-highlighted">Async check</h2>
              <p class="mt-1 text-xs text-muted">
                Handle availability visibly transitions while typing.
              </p>
            </div>
            <UIcon name="i-lucide-loader-circle" class="size-5 text-primary" />
          </div>
        </div>
        <div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-medium text-highlighted">Step scope</h2>
              <p class="mt-1 text-xs text-muted">Next validates only the visible step.</p>
            </div>
            <UIcon name="i-lucide-list-checks" class="size-5 text-primary" />
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section class="min-w-0 border-y border-default py-6" aria-label="Validation form">
          <NutForm :form="form" />
        </section>

        <aside class="grid content-start gap-4" aria-label="Validation controls and status">
          <section class="grid gap-3 border-y border-default py-4">
            <div class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-sm font-medium text-highlighted">Assessment controls</h2>
                <UBadge :color="form.isDirty.value ? 'warning' : 'neutral'" variant="subtle">
                  {{ form.isDirty.value ? 'Dirty' : 'Pristine' }}
                </UBadge>
              </div>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <UButton icon="i-lucide-shield-check" variant="soft" @click="validateAll">
                  Validate all
                </UButton>
                <UButton
                  icon="i-lucide-scan-line"
                  color="neutral"
                  variant="soft"
                  @click="validateCurrentStep"
                >
                  Validate current step
                </UButton>
                <UButton
                  icon="i-lucide-send"
                  color="neutral"
                  variant="soft"
                  :loading="form.isSubmitting.value"
                  @click="submitForm"
                >
                  Submit through engine
                </UButton>
                <UButton
                  icon="i-lucide-rotate-ccw"
                  color="neutral"
                  variant="ghost"
                  @click="resetForm"
                >
                  Reset form
                </UButton>
              </div>
              <p class="text-xs text-muted">
                Current step: {{ form.navigation.currentStepIndex.value + 1 }} of
                {{ form.navigation.steps.value.length }} ·
                {{ form.validation.errors.value.length }} validation error(s)
              </p>
              <p
                v-if="lastValidation !== 'idle'"
                class="text-xs"
                :class="lastValidation === 'valid' ? 'text-primary' : 'text-danger'"
                role="status"
              >
                {{ lastValidation === 'valid' ? 'Validation passed.' : 'Validation found errors.' }}
              </p>
            </div>
          </section>

          <section class="grid gap-3 border-b border-default pb-4">
            <div class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-sm font-medium text-highlighted">Async handle rule</h2>
                <UBadge
                  :color="
                    form.isSubmitting.value
                      ? 'warning'
                      : handleValidationState === 'taken'
                        ? 'error'
                        : handleValidationState === 'available'
                          ? 'success'
                          : 'neutral'
                  "
                  variant="subtle"
                >
                  {{
                    form.isSubmitting.value
                      ? 'Submit validation'
                      : handleValidationState === 'pending'
                        ? 'Field validating…'
                        : handleValidationState
                  }}
                </UBadge>
              </div>
              <p class="text-xs text-muted">
                Type in Workspace handle and hold the 950ms validation window to exercise the
                field-level spinner. This pending state is independent from Next and Submit; enter
                “taken” to make the rule show an error.
              </p>
            </div>
          </section>

          <section class="grid gap-3 border-b border-default pb-4">
            <div class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-sm font-medium text-highlighted">Team context query</h2>
                <UBadge v-if="teamContext?.pending" color="warning" variant="subtle"
                  >Loading</UBadge
                >
                <UBadge v-else-if="teamContext?.error" color="error" variant="subtle">Error</UBadge>
                <UBadge v-else color="success" variant="subtle">Ready</UBadge>
              </div>
              <p class="text-xs text-muted">
                The Security step select reads this form context resource and reuses the runtime
                options loader at the field's trailing edge. Refresh is routed through its public
                resource API.
              </p>
              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="outline"
                :loading="teamContext?.fetching || teamContext?.pending"
                @click="retryTeams"
              >
                Refresh teams
              </UButton>
            </div>
          </section>

          <UAlert
            :color="
              form.isSubmitting.value
                ? 'warning'
                : submitState === 'error'
                  ? 'error'
                  : submitState === 'success'
                    ? 'success'
                    : 'neutral'
            "
            :icon="
              form.isSubmitting.value || submitState === 'pending'
                ? 'i-lucide-loader-circle'
                : submitState === 'error'
                  ? 'i-lucide-circle-x'
                  : submitState === 'success'
                    ? 'i-lucide-circle-check'
                    : 'i-lucide-info'
            "
            :title="
              form.isSubmitting.value
                ? 'Async validation pending'
                : submitState === 'pending'
                  ? 'Server validation pending'
                  : submitState === 'error'
                    ? 'Submit prevented'
                    : submitState === 'success'
                      ? 'Submit succeeded'
                      : 'Submit lifecycle'
            "
          >
            {{ submitMessage }}
          </UAlert>

          <section v-if="lastSubmitted" class="grid gap-3 border-b border-default pb-4">
            <h2 class="text-sm font-medium text-highlighted">Submitted output</h2>
            <pre
              class="mt-3 max-h-64 overflow-auto rounded-md bg-inverted p-3 text-xs text-inverted"
              >{{ JSON.stringify(lastSubmitted, null, 2) }}</pre>
          </section>
        </aside>
      </section>
    </main>
  </PlaygroundContent>
</template>
