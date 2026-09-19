<script setup lang="ts">
import { useForm, useFormApi } from '#ui-tools/form'
import type { FormController, FormObject, FormSchema, FormValue } from '#ui-tools/form'

import { arraysFormInput, arraysFormSchema } from '../../forms/arrays'
import { contactFormSchema } from '../../forms/contact'

interface FormEntry {
  key: string
  title: string
  description: string
  schema: FormSchema
  form: FormController<unknown, FormValue>
}

const formApi = useFormApi()
const { accounts } = useAccountsData()
const submitted = ref<{ key: string; data: FormObject } | null>(null)

function register(
  key: string,
  title: string,
  description: string,
  schema: FormSchema,
  input: FormObject,
): FormEntry {
  const form = useForm({
    input,
    onSubmit: ({ formData }) => {
      submitted.value = { data: formData, key }
      return true
    },
    schema,
  })
  return { description, form, key, schema, title }
}

const entries: FormEntry[] = [
  register(
    'contact',
    'Contact',
    'Une personne physique rattachée à un ou plusieurs comptes.',
    contactFormSchema(accounts),
    { accounts: [accounts[3]?.id ?? ''] },
  ),
  register(
    'arrays',
    'Tableaux et listes',
    'Listes primitives, blocs repliables et onglets.',
    arraysFormSchema(),
    arraysFormInput,
  ),
]

async function openModal(entry: FormEntry) {
  const result = await formApi.createForm(entry.schema, { mode: 'modal' })
  if (result.isCompleted) {
    submitted.value = { data: result.formData, key: entry.key }
  }
}
</script>

<template>
  <div class="ex-page">
    <header class="ex-ph">
      <div>
        <h1>Formulaires</h1>
        <p>Chaque formulaire des maquettes, rendu en ligne et en modale par le moteur.</p>
      </div>
    </header>
    <div class="ex-forms">
      <div class="ex-form-stack">
        <section
          v-for="entry in entries"
          :id="`form-${entry.key}`"
          :key="entry.key"
          class="ex-form-card"
        >
          <div class="ex-form-card-head">
            <h2>{{ entry.title }}</h2>
            <small>{{ entry.description }}</small>
            <UButton
              class="ex-form-card-open"
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-app-window"
              label="Modale"
              @click="openModal(entry)"
            />
          </div>
          <NutForm :form="entry.form" />
        </section>
      </div>
      <aside class="ex-form-result">
        <div class="ex-form-card-head">
          <h2>Dernière soumission</h2>
          <small v-if="submitted">{{ submitted.key }}</small>
        </div>
        <pre>{{ submitted ? JSON.stringify(submitted.data, null, 2) : '—' }}</pre>
      </aside>
    </div>
  </div>
</template>
