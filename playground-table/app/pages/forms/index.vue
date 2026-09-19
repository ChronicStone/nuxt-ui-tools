<script setup lang="ts">
import { useForm, useFormApi } from '#ui-tools/form'
import type { FormObject } from '#ui-tools/form'

import { contactFormSchema } from '../../forms/contact'

const formApi = useFormApi()
const { accounts } = useAccountsData()
const schema = contactFormSchema(accounts)
const submitted = ref<FormObject | null>(null)

const form = useForm({
  input: { accounts: [accounts[3]?.id ?? ''] },
  onSubmit: ({ formData }) => {
    submitted.value = formData
    return true
  },
  schema,
})

async function openModal() {
  const result = await formApi.createForm(schema, { mode: 'modal' })
  if (result.isCompleted) {
    submitted.value = result.formData
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
      <div class="ex-ph-acts">
        <UButton
          color="primary"
          icon="i-lucide-user-plus"
          label="Nouveau contact"
          @click="openModal"
        />
      </div>
    </header>
    <div class="ex-forms">
      <section class="ex-form-card">
        <div class="ex-form-card-head">
          <h2>Contact</h2>
          <small>Une personne physique rattachée à un ou plusieurs comptes.</small>
        </div>
        <NutForm :form="form" />
      </section>
      <aside class="ex-form-result">
        <div class="ex-form-card-head">
          <h2>Dernière soumission</h2>
        </div>
        <pre>{{ submitted ? JSON.stringify(submitted, null, 2) : '—' }}</pre>
      </aside>
    </div>
  </div>
</template>
