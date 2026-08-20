<script setup lang="ts">
import { computed, ref } from 'vue'

import { useForm, type FormControlSize, type FormObject, type FormUiConfig } from '#ui-tools/form'

import {
  formControlSizes,
  formFieldPlaygrounds,
  getFormFieldPlayground,
  getFormFieldPlaygroundFields,
} from '../../../lib/form-field-playgrounds'

const route = useRoute()
const definition = computed(() => getFormFieldPlayground(String(route.params.field ?? '')))

if (!definition.value)
  throw createError({ statusCode: 404, statusMessage: 'Unknown form field playground' })

const controlSize = ref<FormControlSize>('md')
const submitted = ref<FormObject | null>(null)
const schema = computed(() => ({
  formKey: `playground.form.field.${definition.value?.id ?? 'unknown'}`,
  title: definition.value?.label,
  controls: {
    validate: true,
    dirtyCheck: true,
  },
  layout: {
    columns: 2,
    gap: 20,
  },
  fields: definition.value ? getFormFieldPlaygroundFields(definition.value) : [],
}))
const input = computed(() => definition.value?.input)
const formUi = computed<FormUiConfig>(() => ({
  control: { size: controlSize.value },
}))
const form = useForm({
  schema,
  input,
  onSubmit: async ({ formData }) => {
    submitted.value = formData
    return { success: true, data: formData }
  },
})
const currentIndex = computed(() =>
  formFieldPlaygrounds.findIndex((entry) => entry.id === definition.value?.id),
)
const previous = computed(() =>
  currentIndex.value > 0 ? formFieldPlaygrounds[currentIndex.value - 1] : undefined,
)
const next = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < formFieldPlaygrounds.length - 1
    ? formFieldPlaygrounds[currentIndex.value + 1]
    : undefined,
)
</script>

<template>
  <PlaygroundContent mode="document">
    <main class="mx-auto grid w-full max-w-6xl gap-7 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-4 border-b border-default pb-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="grid max-w-3xl gap-1.5">
            <div class="flex items-center gap-2 text-xs text-muted">
              <NuxtLink to="/form/fields" class="hover:text-highlighted">Field labs</NuxtLink>
              <UIcon name="i-lucide-chevron-right" class="size-3.5" />
              <span>{{ definition?.id }}</span>
            </div>
            <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
              {{ definition?.label }}
            </h1>
            <p class="text-sm leading-6 text-muted">{{ definition?.description }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2" aria-label="Field size">
            <span class="mr-1 text-xs font-medium text-muted">Control size</span>
            <UButton
              v-for="size in formControlSizes"
              :key="size"
              size="xs"
              color="neutral"
              :variant="controlSize === size ? 'solid' : 'outline'"
              :aria-pressed="controlSize === size"
              @click="controlSize = size"
            >
              {{ size }}
            </UButton>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <NuxtLink
            v-if="previous"
            :to="`/form/fields/${previous.id}`"
            class="inline-flex items-center gap-1 text-xs text-muted hover:text-highlighted"
          >
            <UIcon name="i-lucide-arrow-left" class="size-3.5" />
            {{ previous.label }}
          </NuxtLink>
          <span v-else />
          <NuxtLink
            v-if="next"
            :to="`/form/fields/${next.id}`"
            class="inline-flex items-center gap-1 text-xs text-muted hover:text-highlighted"
          >
            {{ next.label }}
            <UIcon name="i-lucide-arrow-right" class="size-3.5" />
          </NuxtLink>
        </div>
      </header>

      <div class="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="min-w-0" aria-label="Field example">
          <NutForm :form="form" :ui="formUi" />
        </section>

        <aside class="min-w-0 xl:border-l xl:border-default xl:pl-6" aria-label="Field diagnostics">
          <div class="grid gap-5 xl:sticky xl:top-20">
            <section class="grid gap-2">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Runtime</h2>
                <UBadge color="neutral" variant="soft" size="sm">{{ controlSize }}</UBadge>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-md border border-default px-3 py-2">
                  <div class="text-muted">Dirty</div>
                  <div class="mt-0.5 font-medium text-highlighted">
                    {{ form.meta.isDirty.value ? 'Yes' : 'No' }}
                  </div>
                </div>
                <div class="rounded-md border border-default px-3 py-2">
                  <div class="text-muted">Errors</div>
                  <div class="mt-0.5 font-medium text-highlighted">
                    {{ form.validation.errors.value.length }}
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton size="xs" color="neutral" variant="outline" @click="form.validate({ focus: true })">
                  Validate + focus
                </UButton>
                <UButton size="xs" color="neutral" variant="ghost" @click="form.reset">
                  Reset
                </UButton>
              </div>
            </section>

            <section v-if="definition?.notes?.length" class="grid gap-1.5 border-t border-default pt-4">
              <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Notes</h2>
              <p v-for="note in definition.notes" :key="note" class="text-xs leading-5 text-muted">
                {{ note }}
              </p>
            </section>

            <section class="grid gap-1.5 border-t border-default pt-4">
              <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Internal state</h2>
              <pre class="max-h-60 overflow-auto rounded-md bg-elevated p-3 text-[11px] leading-5 text-muted">{{ JSON.stringify(form.state.internal.value, null, 2) }}</pre>
            </section>

            <section class="grid gap-1.5 border-t border-default pt-4">
              <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Output</h2>
              <pre class="max-h-60 overflow-auto rounded-md bg-elevated p-3 text-[11px] leading-5 text-muted">{{ JSON.stringify(form.state.output.value, null, 2) }}</pre>
            </section>

            <section class="grid gap-1.5 border-t border-default pt-4">
              <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">Submitted</h2>
              <pre class="max-h-48 overflow-auto rounded-md bg-elevated p-3 text-[11px] leading-5 text-muted">{{ JSON.stringify(submitted ?? {}, null, 2) }}</pre>
            </section>
          </div>
        </aside>
      </div>
    </main>
  </PlaygroundContent>
</template>
