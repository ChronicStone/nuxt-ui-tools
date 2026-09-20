<script setup lang="ts">
import { useForm, useFormApi } from '#ui-tools/form'
import type { FormController, FormObject, FormSchema, FormValue } from '#ui-tools/form'

import { accountFormSchema } from '../../forms/account'
import { arraysFormInput, arraysFormSchema } from '../../forms/arrays'
import { assessImportFormSchema } from '../../forms/assess-import'
import {
  billedBulkFormSchema,
  confirmFormSchema,
  consumptionFormSchema,
  invoiceFormSchema,
  metadataFormInput,
  metadataFormSchema,
  presetFormInput,
  presetFormSchema,
  productFormInput,
  productFormSchema,
  productLineFormSchema,
  versionTypeFormSchema,
} from '../../forms/catalogue'
import { contactFormSchema } from '../../forms/contact'
import { contractFormSchema } from '../../forms/contract'
import { sendDemandFormSchema } from '../../forms/demand'
import { loginFormSchema } from '../../forms/login'
import { parityFormInput, parityFormSchema } from '../../forms/parity'
import { profileFormInput, profileFormSchema } from '../../forms/profile'
import {
  groupFormSchema,
  inviteFormSchema,
  locationFormSchema,
  memoFormSchema,
  rateFormSchema,
  testCenterFormSchema,
} from '../../forms/relations'

interface FormEntry {
  key: string
  title: string
  description: string
  schema: FormSchema
  form: FormController<unknown, FormValue>
}

const formApi = useFormApi()
const { accounts, contacts } = useAccountsData()
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
    'accountNew',
    'Nouveau compte',
    'Type, identité, contacts, adresse, facturation et documents.',
    accountFormSchema(contacts, 'new'),
    { accountType: 'customer' },
  ),
  register(
    'account',
    'Modifier le compte',
    'Type, identité, contacts, adresse, facturation et documents.',
    accountFormSchema(contacts, 'edit'),
    { ...accounts[2] },
  ),
  register(
    'contract',
    'Nouveau contrat',
    'Général, produits, objectifs et documents.',
    contractFormSchema(accounts),
    { currency: 'EUR', paymentTerm: '30', products: [{ active: true }] },
  ),
  register(
    'sendDemand',
    'Envoyer une demande',
    'Modèle, destinataires, délai et relances.',
    sendDemandFormSchema(accounts),
    { accounts: [accounts[4]?.id ?? ''] },
  ),
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
  register(
    'parity',
    'Propriétés de parité',
    'Masques, préfixes, formats, labels à gauche, descriptions.',
    parityFormSchema(),
    parityFormInput,
  ),
  register(
    'invite',
    'Inviter un utilisateur',
    'Espace client.',
    inviteFormSchema(accounts, contacts),
    {
      accounts: [accounts[0]?.id ?? ''],
    },
  ),
  register('group', 'Groupe de comptes', 'Filtres et reporting.', groupFormSchema(accounts), {}),
  register('rate', 'Taux de change', 'Taux mensuel USD → EUR.', rateFormSchema(), {
    month: '2026-10',
  }),
  register(
    'testcenter',
    'Centre de test',
    'Lieu physique de passage.',
    testCenterFormSchema(accounts),
    {},
  ),
  register('location', 'Manager location', 'Entité VTest.', locationFormSchema(), {}),
  register(
    'memo',
    'Mémo de compte',
    'Fil de discussion rattaché à un compte.',
    memoFormSchema(accounts, contacts),
    {
      participants: [contacts[1]?.id ?? ''],
    },
  ),
  register('product', 'Produit', 'Catalogue, onglets.', productFormSchema(), productFormInput),
  register('productLine', 'Ligne de produits', 'Catalogue.', productLineFormSchema(), {}),
  register('versionType', 'Type de version', 'Catalogue.', versionTypeFormSchema(), {}),
  register(
    'metadata',
    'Métadonnée produit',
    'Niveaux ordonnés.',
    metadataFormSchema(),
    metadataFormInput,
  ),
  register('preset', 'Préréglage', 'Catalogue, xl.', presetFormSchema(), presetFormInput),
  register(
    'consumption',
    'Consommation',
    'Sélections en cascade.',
    consumptionFormSchema(accounts),
    {},
  ),
  register(
    'invoice',
    'Facture',
    'Rattachement, période, document.',
    invoiceFormSchema(accounts),
    {},
  ),
  register('billedBulk', 'Marquer la facturation', 'Liste radio.', billedBulkFormSchema(), {}),
  register('confirm', 'Résilier le contrat', 'Confirmation dangereuse.', confirmFormSchema(), {}),
  register(
    'profile',
    'Profil et préférences',
    'Onglets, mot de passe, notifications.',
    profileFormSchema(),
    profileFormInput,
  ),
  register('login', 'Connexion', 'Formulaire d’authentification.', loginFormSchema(), {
    email: 'thao@exassess.com',
    remember: true,
  }),
  register(
    'assessImport',
    'Importer des assessments',
    'Étape fichier de l’assistant d’import.',
    assessImportFormSchema(),
    {},
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
