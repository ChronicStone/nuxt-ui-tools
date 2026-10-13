<script setup lang="ts">
import { defineFormPageSchema, defineFormPageSection, useForm } from '#ui-tools/form'

const { t } = useI18n()
const toast = useToast()

const ACCOUNT_TYPES = [
  { group: 'client', icon: 'i-lucide-school', value: 'school' },
  { group: 'client', icon: 'i-lucide-building-2', value: 'company' },
  { group: 'client', icon: 'i-lucide-landmark', value: 'authority' },
  { group: 'partner', icon: 'i-lucide-handshake', value: 'reseller' },
  { group: 'partner', icon: 'i-lucide-truck', value: 'distributor' },
  { group: 'center', icon: 'i-lucide-map-pin', value: 'testCenter' },
  { group: 'internal', icon: 'i-lucide-shield-check', value: 'admin' },
  { group: 'internal', icon: 'i-lucide-life-buoy', value: 'support' },
] as const
const PARENTS = ['pasteur', 'alpha'] as const
const CENTERS = ['paris', 'lyon'] as const

function typeSection() {
  return defineFormPageSection({
    description: () => t('pages.formPagePlain.sections.type.description'),
    fields: [
      {
        key: 'accountType',
        layout: { span: 'full' },
        // Eight types stay short as compact cards under four headings.
        options: () =>
          ACCOUNT_TYPES.map((type) => ({
            description: t(`pages.formPagePlain.types.${type.value}.description`),
            group: t(`pages.formPagePlain.groups.${type.group}`),
            icon: type.icon,
            label: t(`pages.formPagePlain.types.${type.value}.label`),
            value: type.value,
          })),
        props: { columns: '1 md:2 xl:3', density: 'compact', indicator: 'corner' },
        required: true,
        type: 'radio-card',
      },
    ],
    key: 'type',
    label: () => t('pages.formPagePlain.sections.type.label'),
  })
}

function identitySection() {
  return defineFormPageSection({
    description: () => t('pages.formPagePlain.sections.identity.description'),
    fields: [
      {
        key: 'name',
        label: () => t('pages.formPagePlain.fields.name'),
        layout: { span: 'full' },
        required: true,
        type: 'text',
      },
      {
        key: 'parent',
        label: () => t('pages.formPagePlain.fields.parent'),
        options: () =>
          PARENTS.map((value) => ({ label: t(`pages.formPagePlain.parents.${value}`), value })),
        type: 'select',
      },
      {
        dependencies: ['parent'],
        // Disabled until a parent account is chosen, and says why instead of staying silent.
        disabled: ({ deps }) => !deps.get('parent'),
        disabledReason: () => t('pages.formPagePlain.fields.centerReason'),
        key: 'center',
        label: () => t('pages.formPagePlain.fields.center'),
        options: () =>
          CENTERS.map((value) => ({ label: t(`pages.formPagePlain.centers.${value}`), value })),
        type: 'select',
      },
    ],
    key: 'identity',
    label: () => t('pages.formPagePlain.sections.identity.label'),
  })
}

function billingSection() {
  return defineFormPageSection({
    description: () => t('pages.formPagePlain.sections.billing.description'),
    fields: [
      {
        key: 'billingEmail',
        label: () => t('pages.formPagePlain.fields.billingEmail'),
        props: { inputType: 'email' },
        type: 'text',
      },
      {
        key: 'vatNumber',
        label: () => t('pages.formPagePlain.fields.vatNumber'),
        type: 'text',
      },
    ],
    key: 'billing',
    label: () => t('pages.formPagePlain.sections.billing.label'),
  })
}

function documentsSection() {
  return defineFormPageSection({
    description: () => t('pages.formPagePlain.sections.documents.description'),
    fields: [
      {
        key: 'registration',
        label: () => t('pages.formPagePlain.fields.registration'),
        layout: { span: 'full' },
        type: 'text',
      },
    ],
    key: 'documents',
    label: () => t('pages.formPagePlain.sections.documents.label'),
  })
}

const form = useForm({
  onSubmit: () => {
    toast.add({ color: 'success', title: t('pages.formPagePlain.saved') })
    return true
  },
  schema: defineFormPageSchema({
    actions: [{ icon: 'i-lucide-check', key: 'submit' }],
    formKey: 'playground.form.page-plain',
    header: {
      description: () => t('pages.formPagePlain.description'),
      eyebrow: () => t('pages.formPagePlain.eyebrow'),
      title: () => t('pages.formPagePlain.title'),
    },
    navigation: { minSections: 3, title: () => t('pages.formPagePlain.navigation') },
    sections: [typeSection(), identitySection(), billingSection(), documentsSection()],
    ui: { page: { surface: 'plain' } },
  }),
})
</script>

<template>
  <PlaygroundContent mode="fixed">
    <NutFormPage :form />
  </PlaygroundContent>
</template>
