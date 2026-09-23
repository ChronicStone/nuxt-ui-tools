<script setup lang="ts">
import { defineFormPageSchema, defineFormPageSection, useForm } from '#ui-tools/form'

const { t } = useI18n()
const toast = useToast()

const PLANS = [
  { icon: 'i-lucide-sprout', value: 'starter' },
  { icon: 'i-lucide-users', value: 'team' },
  { icon: 'i-lucide-building-2', value: 'enterprise' },
] as const

function workspaceSection() {
  return defineFormPageSection({
    description: () => t('pages.formPage.sections.workspace.description'),
    fields: [
      {
        key: 'name',
        label: () => t('pages.formPage.fields.name'),
        required: true,
        type: 'text',
      },
      {
        key: 'region',
        label: () => t('pages.formPage.fields.region'),
        options: () => [
          { label: t('pages.formPage.regions.eu'), value: 'eu' },
          { label: t('pages.formPage.regions.us'), value: 'us' },
        ],
        required: true,
        type: 'select',
      },
      {
        key: 'plan',
        label: () => t('pages.formPage.fields.plan'),
        layout: { span: 'full' },
        options: () =>
          PLANS.map((plan) => ({
            ...plan,
            description: t(`pages.formPage.plans.${plan.value}.description`),
            label: t(`pages.formPage.plans.${plan.value}.label`),
          })),
        props: { columns: '1 md:3', icon: 'tile', indicator: 'corner' },
        required: true,
        type: 'radio-card',
      },
    ],
    key: 'workspace',
    label: () => t('pages.formPage.sections.workspace.label'),
  })
}

function notificationsSection() {
  return defineFormPageSection({
    description: () => t('pages.formPage.sections.notifications.description'),
    fields: [
      {
        key: 'digest',
        label: () => t('pages.formPage.fields.digest'),
        options: () =>
          (['daily', 'weekly', 'never'] as const).map((value) => ({
            label: t(`pages.formPage.digests.${value}`),
            value,
          })),
        type: 'select',
      },
      {
        key: 'mentions',
        label: () => t('pages.formPage.fields.mentions'),
        layout: { span: 'full' },
        type: 'checkbox',
      },
    ],
    key: 'notifications',
    label: () => t('pages.formPage.sections.notifications.label'),
  })
}

function securitySection() {
  return defineFormPageSection({
    description: () => t('pages.formPage.sections.security.description'),
    fields: [
      {
        // The plan is picked in the Workspace section: a page is one form, one state.
        dependencies: ['plan'],
        help: () => t('pages.formPage.fields.ssoDomainHelp'),
        key: 'ssoDomain',
        label: () => t('pages.formPage.fields.ssoDomain'),
        placeholder: 'acme.com',
        required: ({ deps }) => 'plan' in deps && deps.plan === 'enterprise',
        type: 'text',
      },
      {
        key: 'twoFactor',
        label: () => t('pages.formPage.fields.twoFactor'),
        layout: { span: 'full' },
        type: 'switch',
      },
    ],
    key: 'security',
    label: () => t('pages.formPage.sections.security.label'),
  })
}

const form = useForm({
  input: {
    digest: 'weekly',
    mentions: true,
    name: 'Design systems',
    plan: 'team',
    region: 'eu',
    twoFactor: false,
  },
  onSubmit: () => {
    toast.add({ color: 'success', title: t('pages.formPage.saved') })
    return true
  },
  schema: defineFormPageSchema({
    actions: [{ icon: 'i-lucide-check', key: 'submit' }],
    controls: { dirtyCheck: true },
    formKey: 'playground.form.page',
    header: {
      description: () => t('pages.formPage.description'),
      eyebrow: () => t('pages.formPage.eyebrow'),
      title: () => t('pages.formPage.title'),
    },
    navigation: { title: () => t('pages.formPage.navigation') },
    sections: [workspaceSection(), notificationsSection(), securitySection()],
  }),
})
</script>

<template>
  <PlaygroundContent mode="fixed">
    <NutFormPage :form />
  </PlaygroundContent>
</template>
