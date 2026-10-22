<script setup lang="ts">
import { queryOptions } from '@tanstack/vue-query'

import { defineFormSchema, useForm } from '#ui-tools/form'

import { displayCatalog } from '../../lib/display-catalog'

const PLANS = {
  linguaskill: { label: 'Linguaskill Business', price: 72 },
  pipplet: { label: 'Pipplet', price: 49 },
  toeic: { label: 'TOEIC Listening & Reading', price: 96 },
} as const
type PlanKey = keyof typeof PLANS
const CONTRACT = { credits: 120, used: 84 }
const euros = new Intl.NumberFormat('en-GB', { currency: 'EUR', style: 'currency' })

function isPlan(value: string | undefined): value is PlanKey {
  return value === 'toeic' || value === 'linguaskill' || value === 'pipplet'
}

function seatsOf(value: number | string | undefined) {
  return Math.max(1, Math.min(80, Number(value) || 1))
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function fetchPlanNote(plan: PlanKey, fail: boolean) {
  await wait(700)
  if (fail) throw new Error('The notes service did not answer.')
  return {
    author: 'Ben Martin',
    body: `${PLANS[plan].label}: book the oral part at least a week ahead.`,
  }
}

const schema = defineFormSchema({
  fields: [
    {
      default: 'toeic',
      key: 'plan',
      label: 'Test',
      options: Object.entries(PLANS).map(([value, plan]) => ({ label: plan.label, value })),
      type: 'select',
    },
    { default: 30, key: 'seats', label: 'Candidates', layout: { span: 1 }, type: 'number' },
    {
      condition: ({ deps }) =>
        CONTRACT.used + seatsOf(deps.get<number>('seats')) > CONTRACT.credits - 10,
      dependencies: ['seats'],
      display: 'alert',
      key: 'creditNotice',
      props: ({ deps }) => {
        const left = CONTRACT.credits - CONTRACT.used - seatsOf(deps.get<number>('seats'))
        return left < 0
          ? {
              message: 'Extra credits are billed at the public rate.',
              title: `The order goes ${-left} credits over the contract`,
              tone: 'error',
            }
          : {
              message: 'Think about renewing before Dec 31.',
              title: `${left} credits will be left`,
              tone: 'warning',
            }
      },
      type: 'info',
    },
    {
      dependencies: ['plan', 'seats'],
      display: 'breakdown',
      key: 'quote',
      layout: { span: 1 },
      props: ({ deps }) => {
        const plan = PLANS[isPlan(deps.get<string>('plan')) ? deps.get<PlanKey>('plan') : 'toeic']
        const seats = seatsOf(deps.get<number>('seats'))
        const gross = seats * plan.price
        const discount = seats >= 20 ? gross * 0.1 : 0
        const net = gross - discount
        return {
          lines: [
            {
              detail: `${seats} × ${euros.format(plan.price)}`,
              label: 'Licences',
              value: euros.format(gross),
            },
            discount
              ? {
                  detail: '10 %',
                  label: 'Volume discount',
                  tone: 'success',
                  value: `−${euros.format(discount)}`,
                }
              : { detail: 'from 20', label: 'Volume discount', muted: true, value: '—' },
            { label: 'Subtotal', subtotal: true, value: euros.format(net) },
            { detail: '20 %', label: 'VAT', value: euros.format(net * 0.2) },
          ],
          total: { label: 'Total', value: euros.format(net * 1.2) },
        }
      },
      type: 'info',
    },
    {
      dependencies: ['seats'],
      display: 'meter',
      key: 'credits',
      layout: { span: 1 },
      props: ({ deps }) => {
        const seats = seatsOf(deps.get<number>('seats'))
        const room = CONTRACT.credits - CONTRACT.used
        return {
          label: 'Contract credits',
          max: CONTRACT.credits,
          parts: [
            { label: 'Used', tone: 'neutral', value: CONTRACT.used },
            {
              label: 'This order',
              tone: seats > room ? 'error' : 'primary',
              value: Math.min(seats, room),
            },
          ],
          valueLabel: `${CONTRACT.used + seats} / ${CONTRACT.credits}`,
          variant: 'segments',
        }
      },
      type: 'info',
    },
    {
      default: false,
      key: 'failNote',
      label: 'Make the note fail to load',
      layout: { span: 'full' },
      type: 'switch',
    },
    {
      dependencies: ['plan', 'failNote'],
      display: 'text',
      key: 'planNote',
      label: 'Note on the test',
      props: ({ deps }) => {
        const plan = isPlan(deps.get<string>('plan')) ? deps.get<PlanKey>('plan') : 'toeic'
        const fail = deps.get('failNote') === true
        return queryOptions({
          queryFn: () => fetchPlanNote(plan, fail),
          queryKey: ['playground', 'plan-note', plan, fail],
          select: (note) => ({
            appearance: 'quote' as const,
            author: note.author,
            text: note.body,
          }),
        })
      },
      type: 'info',
    },
    {
      display: 'code',
      hint: 'Read only',
      key: 'webLink',
      layout: { span: 1 },
      label: 'Web link',
      props: {
        icon: 'i-lucide-link',
        value: 'https://example.com/i/ARV-Q4-7KD2',
        variant: 'value',
      },
      type: 'info',
    },
    {
      dependencies: ['seats'],
      display: 'facts',
      key: 'summary',
      layout: { span: 1 },
      props: ({ api, deps }) => ({
        actions: [
          {
            icon: 'i-lucide-rotate-ccw',
            label: 'Back to 20 candidates',
            onClick: () => api.form.set('seats', 20),
          },
          { icon: 'i-lucide-x', label: 'Close', onClick: () => void api.form.close() },
        ],
        items: [
          { label: 'Candidates', value: seatsOf(deps.get<number>('seats')) },
          { label: 'Contract', mono: true, value: 'CT-2026-0148' },
        ],
        layout: 'inline',
      }),
      type: 'info',
    },
  ],
  formKey: 'playground.form.display',
  header: { description: 'Display blocks read the form values.', title: 'New licence order' },
  layout: { columns: '1 md:2', fieldSpan: 1, gap: 20 },
})

const form = useForm({ onSubmit: () => ({ success: true }), schema })
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-5xl gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid gap-2">
        <p class="font-mono text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
          Form / display blocks
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Display blocks</h1>
        <p class="max-w-2xl text-sm leading-6 text-muted">
          An info field draws one of {{ displayCatalog.length }} display kinds. Its props can read
          the form values, load data through a promise or a query, and act on the form through
          <code>api</code>. Every kind also renders on its own with <code>NutDisplay</code>.
        </p>
      </header>

      <section class="grid gap-3" aria-labelledby="display-form">
        <h2 id="display-form" class="text-sm font-semibold text-highlighted">In a form</h2>
        <div class="rounded-xl border border-default p-5" data-testid="display-form">
          <NutForm :form="form" />
        </div>
      </section>

      <section
        v-for="entry in displayCatalog"
        :id="`display-${entry.kind}`"
        :key="entry.kind"
        class="grid gap-3"
        :data-display-kind="entry.kind"
      >
        <header class="flex items-baseline gap-3 border-b border-default pb-2">
          <h2 class="font-mono text-sm font-semibold text-highlighted">{{ entry.kind }}</h2>
          <p class="text-sm text-muted">{{ entry.description }}</p>
        </header>
        <div class="grid gap-x-6 gap-y-7 md:grid-cols-2">
          <div
            v-for="example in entry.examples"
            :key="example.caption"
            class="grid min-w-0 content-start gap-2"
            :class="example.wide ? 'md:col-span-2' : ''"
          >
            <span class="font-mono text-[11px] text-dimmed">{{ example.caption }}</span>
            <NutDisplay
              :display="example.spec.display"
              :props="example.spec.props"
              :preset="example.spec.preset"
            />
          </div>
        </div>
      </section>
    </section>
  </PlaygroundContent>
</template>
