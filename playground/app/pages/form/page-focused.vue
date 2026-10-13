<script setup lang="ts">
import { defineFormPageSchema, defineFormPageSection, useForm } from '#ui-tools/form'

const { t } = useI18n()
const toast = useToast()

const ROLES = ['reviewer', 'manager', 'owner'] as const

function contactSection() {
  return defineFormPageSection({
    description: () => t('pages.formPageFocused.sections.contact.description'),
    fields: [
      {
        key: 'email',
        label: () => t('pages.formPageFocused.fields.email'),
        props: { inputType: 'email' },
        required: true,
        type: 'text',
      },
      {
        key: 'name',
        label: () => t('pages.formPageFocused.fields.name'),
        type: 'text',
      },
    ],
    key: 'contact',
    label: () => t('pages.formPageFocused.sections.contact.label'),
  })
}

function accessSection() {
  return defineFormPageSection({
    description: () => t('pages.formPageFocused.sections.access.description'),
    fields: [
      {
        key: 'role',
        label: () => t('pages.formPageFocused.fields.role'),
        options: () =>
          ROLES.map((value) => ({ label: t(`pages.formPageFocused.roles.${value}`), value })),
        required: true,
        type: 'select',
      },
      {
        key: 'message',
        label: () => t('pages.formPageFocused.fields.message'),
        layout: { span: 'full' },
        type: 'textarea',
      },
    ],
    key: 'access',
    label: () => t('pages.formPageFocused.sections.access.label'),
  })
}

const form = useForm({
  onSubmit: () => {
    toast.add({ color: 'success', title: t('pages.formPageFocused.saved') })
    return true
  },
  schema: defineFormPageSchema({
    actions: [{ icon: 'i-lucide-send', key: 'submit' }],
    formKey: 'playground.form.page-focused',
    header: {
      description: () => t('pages.formPageFocused.description'),
      eyebrow: () => t('pages.formPageFocused.eyebrow'),
      title: () => t('pages.formPageFocused.title'),
    },
    // Two sections are below the threshold: no side navigation, one focused column.
    navigation: { minSections: 3 },
    sections: [contactSection(), accessSection()],
  }),
})
</script>

<template>
  <PlaygroundContent mode="fixed">
    <NutFormPage :form />
  </PlaygroundContent>
</template>
