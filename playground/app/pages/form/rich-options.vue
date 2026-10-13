<script setup lang="ts">
import { h } from 'vue'

import { defineFormSchema, useForm } from '#ui-tools/form'
import type {
  FormOption,
  FormOptionRenderContext,
  FormOptionValueRenderContext,
} from '#ui-tools/form'

interface Currency extends FormOption<'EUR' | 'USD' | 'GBP'> {
  symbol: string
}

/** A round picture in a data URI, so the avatars need no network. */
function portrait(initials: string, hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 55% 82%)"/><text x="32" y="40" font-family="system-ui" font-size="24" font-weight="600" text-anchor="middle" fill="hsl(${hue} 45% 28%)">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const currencies: readonly Currency[] = [
  { label: 'Euro', suffix: 'EUR', symbol: '€', value: 'EUR' },
  { label: 'US dollar', suffix: 'USD', symbol: '$', value: 'USD' },
  { label: 'Pound sterling', suffix: 'GBP', symbol: '£', value: 'GBP' },
]

const people = [
  {
    avatar: { alt: 'Camille Durand', src: portrait('CD', 200) },
    description: 'Head of assessment',
    label: 'Camille Durand',
    value: 'camille',
  },
  {
    avatar: { alt: 'Louis Martin', src: portrait('LM', 20) },
    description: 'Test center manager',
    label: 'Louis Martin',
    value: 'louis',
  },
  { avatar: { text: 'NB' }, description: 'No picture yet', label: 'Nadia Benali', value: 'nadia' },
  { avatar: {}, label: 'Théo Garnier', value: 'theo' },
  {
    avatar: { alt: 'Inès Rousseau', src: portrait('IR', 140) },
    description: 'Partner success',
    label: 'Inès Rousseau',
    value: 'ines',
  },
] as const

const statuses = [
  {
    chip: { color: 'success' },
    description: 'Visible to candidates',
    label: 'Published',
    value: 'published',
  },
  {
    chip: { color: 'warning' },
    description: 'Waiting for a review',
    label: 'In review',
    value: 'review',
  },
  {
    chip: { color: 'error' },
    description: 'Closed to new candidates',
    label: 'Archived',
    value: 'archived',
  },
  { chip: { color: 'neutral' }, label: 'Draft', value: 'draft' },
  { chip: {}, label: 'Default dot', value: 'default' },
] as const

const plans = [
  {
    description: 'One workspace, simple workflows',
    icon: 'i-lucide-rocket',
    label: 'Starter',
    suffix: '0 €',
    value: 'starter',
  },
  {
    description: 'Several teams and shared libraries',
    icon: 'i-lucide-users',
    label: 'Scale',
    suffix: '49 €',
    value: 'scale',
  },
  {
    description: 'Governance, audit trail, and SSO',
    icon: 'i-lucide-building-2',
    label: 'Enterprise',
    suffix: 'On quote',
    value: 'enterprise',
  },
] as const

const accountTypes = [
  {
    description: 'Lycées et universités',
    group: 'Organisation cliente',
    icon: 'i-lucide-school',
    label: 'École',
    value: 'school',
  },
  {
    description: 'Employeurs privés et organismes de formation',
    group: 'Organisation cliente',
    icon: 'i-lucide-building-2',
    label: 'Entreprise',
    value: 'company',
  },
  {
    description: 'Collectivités locales et régionales',
    group: 'Organisation cliente',
    icon: 'i-lucide-landmark',
    label: 'Collectivité',
    value: 'authority',
  },
  {
    description: 'Vend des licences à ses propres clients',
    group: 'Partenaire',
    icon: 'i-lucide-handshake',
    label: 'Revendeur',
    value: 'reseller',
  },
  {
    description: 'Approvisionne plusieurs revendeurs',
    group: 'Partenaire',
    icon: 'i-lucide-truck',
    label: 'Distributeur',
    value: 'distributor',
  },
  {
    description: 'Organise les sessions sur site',
    group: 'Centre de test',
    icon: 'i-lucide-map-pin',
    label: 'Centre de test',
    value: 'center',
  },
  {
    description: 'Compte pour les démonstrations commerciales',
    group: 'Compte de test',
    icon: 'i-lucide-flask-conical',
    label: 'Démonstration',
    value: 'demo',
  },
  {
    description: 'Compte jetable pour les tests automatisés',
    group: 'Compte de test',
    icon: 'i-lucide-bug',
    label: 'Recette',
    value: 'qa',
  },
] as const

async function loadPeople() {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return people
}

const schema = defineFormSchema({
  controls: { dirtyCheck: true },
  fields: [
    {
      default: 'EUR',
      description: 'The suffix reads after the label, dimmed, and in the closed control.',
      key: 'currencySuffix',
      label: 'Currency, with a suffix',
      options: currencies,
      type: 'select',
    },
    {
      default: 'USD',
      description: 'renderOption draws each row, renderValue the closed control.',
      key: 'currencyCustom',
      label: 'Currency, rendered',
      options: currencies,
      renderOption: ({ item, option }: FormOptionRenderContext<Currency>) =>
        h('span', { class: 'flex items-baseline gap-2' }, [
          h('span', { class: 'w-4 text-center font-medium' }, item.symbol),
          h('span', option.label),
          h('span', { class: 'text-dimmed tabular-nums' }, option.suffix),
        ]),
      renderValue: ({ item, option }: FormOptionValueRenderContext<Currency>) =>
        h('span', { class: 'font-medium tabular-nums' }, `${item.symbol} ${option.suffix}`),
      type: 'select',
    },
    {
      default: 'review',
      key: 'status',
      label: 'Status, with chips',
      options: statuses,
      type: 'select',
    },
    {
      key: 'statuses',
      label: 'Statuses, multiple',
      options: statuses,
      props: { clearable: true, multiple: true },
      type: 'select',
    },
    {
      default: 'louis',
      key: 'person',
      label: 'Person, with avatars',
      options: people,
      props: { clearable: true },
      type: 'auto-complete',
    },
    {
      key: 'remotePerson',
      label: 'Person, async source',
      options: { source: loadPeople },
      props: { clearable: true },
      type: 'auto-complete',
    },
    {
      default: 'camille',
      key: 'personSelect',
      label: 'Person, in a select',
      options: people,
      props: { searchable: true },
      type: 'select',
    },
    {
      key: 'personRendered',
      label: 'Person, rendered value',
      options: people,
      renderValue: ({ option }) =>
        h('span', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'font-medium' }, option.label),
          h('span', { class: 'text-dimmed' }, option.description),
        ]),
      type: 'auto-complete',
    },
    {
      default: 'center',
      description: 'Options carry a group: headings follow the order they first appear in.',
      key: 'accountType',
      label: 'Account type, grouped',
      options: accountTypes,
      props: { searchable: true },
      type: 'select',
    },
    {
      description: 'Search keeps a heading only while its group has a match.',
      key: 'accountTypeSearch',
      label: 'Account type, grouped auto-complete',
      options: accountTypes,
      type: 'auto-complete',
    },
    {
      default: 'scale',
      key: 'plan',
      label: 'Plan, radio list',
      options: plans,
      type: 'radio',
    },
    {
      default: ['starter'],
      key: 'planChoices',
      label: 'Plans, checkbox group',
      options: plans,
      type: 'checkbox-group',
    },
    {
      default: 'scale',
      key: 'planRendered',
      label: 'Plan, radio rendered',
      options: plans,
      renderOption: ({ option, selected }) =>
        h('span', { class: 'flex items-center justify-between gap-3' }, [
          h('span', { class: selected ? 'font-semibold' : '' }, option.label),
          h('span', { class: 'rounded-full bg-elevated px-2 py-0.5 text-xs' }, option.suffix),
        ]),
      type: 'radio',
    },
    {
      default: 'review',
      key: 'statusRadio',
      label: 'Status, radio with chips',
      options: statuses,
      props: { variant: 'table' },
      type: 'radio',
    },
  ],
  formKey: 'playground.form.rich-options',
  header: {
    description:
      'Option fields draw an icon, an avatar, a chip, a description and a suffix from the schema, and hand the rest to render functions.',
    title: 'Rich options',
  },
  layout: { columns: '1 md:8', fieldSpan: '1 md:4', gap: 24 },
})

const form = useForm({ schema })
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid gap-2">
        <p class="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Form / rich options
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Rich options</h1>
        <p class="max-w-2xl text-sm leading-6 text-muted">
          Select, auto-complete, radio and checkbox group read an icon, an avatar, a chip, a
          description and a suffix from each option, and groups options under headings. Render
          functions replace the content when the default is not enough.
        </p>
      </header>

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <section class="min-w-0 border-y border-default py-6" aria-label="Rich options form">
          <NutForm :form="form" />
        </section>

        <aside class="grid gap-2 border-t border-default pt-4 lg:border-t-0 lg:border-l lg:pl-6">
          <span class="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Output</span>
          <pre
            class="max-h-[32rem] overflow-auto rounded-md bg-elevated p-3 text-[11px] leading-5 text-muted"
            >{{ JSON.stringify(form.state.output.value, null, 2) }}</pre>
        </aside>
      </div>
    </section>
  </PlaygroundContent>
</template>
