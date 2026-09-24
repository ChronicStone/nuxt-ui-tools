<script setup lang="ts">
import { useForm } from '#ui-tools/form'

import { accountFormSchema } from '../../forms/account'

const { contacts } = useAccountsData()
const toast = useToast()

const form = useForm({
  onSubmit: async () => {
    await wait(600)
    toast.add({ color: 'success', title: 'Compte créé · en attente d’activation' })
    await navigateTo('/accounts')
    return true
  },
  schema: accountFormSchema({ contacts }),
})
</script>

<template>
  <NutFormPage :form @cancel="navigateTo('/accounts')" />
</template>
