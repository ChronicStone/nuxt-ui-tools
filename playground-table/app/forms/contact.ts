import { defineFormSchema } from '#ui-tools/form'

import type { Account } from '../data/accounts'
import { wait } from '../utils/wait'

interface AccountOption {
  label: string
  description: string
  value: string
}

function toOption(account: Account): AccountOption {
  return { description: account.legalEntity, label: account.name, value: account.id }
}

export function contactFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Enregistrer' },
    ],
    fields: [
      { key: 'identity', label: 'Identité', type: 'divider' },
      { key: 'firstName', label: 'Prénom', required: true, type: 'text' },
      { key: 'lastName', label: 'Nom', required: true, type: 'text' },
      {
        help: 'Sert d’identifiant pour l’invitation',
        inputType: 'email',
        key: 'email',
        label: 'E-mail',
        required: true,
        type: 'text',
      },
      { defaultCountryCode: 'FR', key: 'phone', label: 'Téléphone', type: 'phone-number' },
      {
        key: 'role',
        label: 'Fonction',
        layout: { span: 'full' },
        placeholder: 'Directrice pédagogique, gestionnaire plateforme…',
        type: 'text',
      },
      { key: 'links', label: 'Rattachements', type: 'divider' },
      {
        key: 'accounts',
        label: 'Comptes',
        layout: { span: 'full' },
        multiple: true,
        options: {
          mode: 'remote',
          pagination: { size: 8, type: 'page' },
          resolveSelected: async ({ values }) => {
            await wait(200)
            return accounts.filter((account) => values.includes(account.id)).map(toOption)
          },
          search: { debounce: 200, minLength: 0 },
          source: async ({ search, page }) => {
            await wait(350)
            const term = search.toLowerCase()
            const filtered = accounts.filter((account) => account.name.toLowerCase().includes(term))
            const start = (page.index - 1) * page.size
            return {
              hasMore: start + page.size < filtered.length,
              options: filtered.slice(start, start + page.size).map(toOption),
            }
          },
        },
        placeholder: 'Rechercher un compte',
        required: true,
        type: 'select',
      },
      {
        default: 'fr',
        key: 'language',
        label: 'Langue préférée',
        options: [
          { label: 'Français', value: 'fr' },
          { label: 'English', value: 'en' },
        ],
        type: 'select',
      },
      {
        help: 'Représentant légal, facturation, gestionnaire plateforme…',
        key: 'roles',
        label: 'Rôles sur le compte',
        multiple: true,
        options: [
          { label: 'Business Manager', value: 'businessManager' },
          { label: 'Représentant légal', value: 'legalRepresentative' },
          { label: 'Facturation', value: 'billing' },
          { label: 'Gestionnaire plateforme', value: 'projectManager' },
        ],
        type: 'select',
      },
      { key: 'access', label: 'Accès', type: 'divider' },
      {
        description: 'Envoie l’e-mail d’invitation à la création',
        key: 'invite',
        label: 'Inviter immédiatement sur l’espace client',
        layout: { span: 'full' },
        type: 'checkbox',
      },
    ],
    formKey: 'contact',
    modal: { maxWidth: 760 },
    title: 'Nouveau contact',
  })
}
