<script setup lang="ts">
import { useForm } from '#ui-tools/form'

import { ACCOUNT_STATUS } from '../../../data/enums'
import { accountFormSchema } from '../../../forms/account'

const route = useRoute()
const { accounts, contacts } = useAccountsData()
const account = accounts.find((candidate) => candidate.id === route.params.id) ?? accounts[0]
const toast = useToast()
const updatedAt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

const form = useForm({
  input: account && { ...account },
  onSubmit: async () => {
    await wait(600)
    toast.add({ color: 'success', title: 'Compte enregistré' })
    return true
  },
  schema: accountFormSchema({ account, contacts }),
})
</script>

<template>
  <NutFormPage :form @cancel="navigateTo('/accounts')">
    <template v-if="account" #navigation-footer>
      <dl class="m-0 grid gap-2">
        <div class="grid gap-0.5">
          <dt class="text-[11.5px] text-dimmed">Statut</dt>
          <dd class="m-0 text-[13px] text-highlighted">{{ ACCOUNT_STATUS[account.status] }}</dd>
        </div>
        <div class="grid gap-0.5">
          <dt class="text-[11.5px] text-dimmed">Contrats actifs</dt>
          <dd class="m-0 text-[13px] text-highlighted">{{ account.contracts }}</dd>
        </div>
        <div class="grid gap-0.5">
          <dt class="text-[11.5px] text-dimmed">Modifié</dt>
          <dd class="m-0 text-[13px] text-highlighted">
            {{ updatedAt.format(new Date(account.updatedAt)) }}
          </dd>
        </div>
      </dl>
    </template>
  </NutFormPage>
</template>
