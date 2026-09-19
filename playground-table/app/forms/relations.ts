import { defineFormSchema } from '#ui-tools/form'

import type { Account, Contact } from '../data/accounts'
import { COUNTRY } from '../data/enums'
import { accountOptions, contactOptions } from './pickers'

const ACTIONS = [
  { key: 'cancel', label: 'Annuler' },
  { key: 'submit', label: 'Enregistrer' },
] as const

const LANGUAGES = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
]

const COUNTRIES = Object.entries(COUNTRY).map(([value, label]) => ({ label, value }))

export function inviteFormSchema(accounts: readonly Account[], contacts: readonly Contact[]) {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { icon: 'i-lucide-send', key: 'submit', label: 'Envoyer l’invitation' },
    ],
    fields: [
      { key: 'recipientSection', label: 'Destinataire', type: 'section' },
      {
        help: 'Ou saisissez une adresse ci-dessous pour créer le contact',
        key: 'contact',
        label: 'Contact existant',
        layout: { span: 'full' },
        options: contactOptions(contacts),
        placeholder: 'Rechercher un contact…',
        type: 'select',
      },
      {
        inputType: 'email',
        key: 'email',
        label: 'E-mail',
        placeholder: 'prenom.nom@organisme.fr',
        required: true,
        type: 'text',
      },
      {
        default: 'fr',
        key: 'language',
        label: 'Langue de l’e-mail',
        options: LANGUAGES,
        type: 'select',
      },
      { key: 'scopeSection', label: 'Périmètre', type: 'section' },
      {
        key: 'accounts',
        label: 'Comptes',
        layout: { span: 'full' },
        multiple: true,
        options: accountOptions(accounts),
        placeholder: 'Ajouter un compte',
        required: true,
        type: 'select',
      },
      {
        default: 'manager',
        help: 'Gestionnaire · Lecture seule · Administrateur du compte',
        key: 'role',
        label: 'Rôle',
        options: [
          { label: 'Gestionnaire', value: 'manager' },
          { label: 'Lecture seule', value: 'reader' },
          { label: 'Administrateur du compte', value: 'admin' },
        ],
        required: true,
        type: 'select',
      },
      {
        key: 'message',
        label: 'Message personnel',
        placeholder: 'Facultatif, ajouté à l’e-mail',
        rows: 2,
        type: 'textarea',
      },
    ],
    header: {
      description:
        'L’invité reçoit un e-mail avec un lien valable 7 jours et choisit son mot de passe.',
      eyebrow: 'Espace client',
      title: 'Inviter un utilisateur',
    },
  })
}

export function groupFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'groupSection', label: 'Groupe', type: 'section' },
      { key: 'name', label: 'Nom', layout: { span: 'full' }, required: true, type: 'text' },
      {
        key: 'description',
        label: 'Description',
        layout: { span: 'full' },
        placeholder: 'Facultatif',
        rows: 2,
        type: 'textarea',
      },
      { key: 'membersSection', label: 'Comptes membres', type: 'section' },
      {
        key: 'accounts',
        label: 'Comptes',
        layout: { span: 'full' },
        multiple: true,
        options: accountOptions(accounts),
        placeholder: 'Ajouter un compte',
        type: 'select',
      },
    ],
    header: {
      description: 'Regroupe des comptes d’un même réseau pour les filtres et le reporting.',
      eyebrow: 'Groupe de comptes',
      title: 'Nouveau groupe',
    },
  })
}

export function rateFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'periodSection', label: 'Période', type: 'section' },
      {
        key: 'month',
        label: 'Mois',
        options: [
          { label: 'Septembre 2026', value: '2026-09' },
          { label: 'Octobre 2026', value: '2026-10' },
          { label: 'Novembre 2026', value: '2026-11' },
        ],
        required: true,
        type: 'select',
      },
      {
        default: 'usd-eur',
        disabled: () => true,
        key: 'pair',
        label: 'Devise',
        options: [{ label: 'USD → EUR', value: 'usd-eur' }],
        type: 'select',
      },
      { key: 'rateSection', label: 'Taux', type: 'section' },
      {
        controls: false,
        format: { maximumFractionDigits: 4, minimumFractionDigits: 4 },
        help: 'Quatre décimales',
        key: 'rate',
        label: '1 USD =',
        mono: true,
        placeholder: '0,9180',
        required: true,
        suffix: 'EUR',
        type: 'number',
      },
      {
        default: 'ecb',
        key: 'source',
        label: 'Source',
        options: [
          { label: 'BCE · moyenne mensuelle', value: 'ecb' },
          { label: 'Saisie manuelle', value: 'manual' },
        ],
        type: 'select',
      },
      {
        color: 'primary',
        content: 'Un taux déjà utilisé sur des factures émises ne peut plus être modifié.',
        icon: 'i-lucide-bell',
        key: 'note',
        type: 'info',
      },
    ],
    header: {
      description: 'Taux mensuel USD → EUR appliqué à la facturation et aux statistiques du mois.',
      eyebrow: 'Taux de change',
      title: 'Saisir un taux',
    },
  })
}

export function testCenterFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'centerSection', label: 'Centre', type: 'section' },
      { key: 'name', label: 'Nom', required: true, type: 'text' },
      {
        key: 'account',
        label: 'Compte',
        options: accountOptions(accounts),
        placeholder: 'Rechercher un compte',
        required: true,
        type: 'select',
      },
      {
        help: 'Rempli par la synchronisation',
        icon: 'i-lucide-target',
        key: 'vtestId',
        label: 'VTEST ID',
        mono: true,
        type: 'text',
      },
      { controls: false, key: 'capacity', label: 'Capacité (postes)', min: 0, type: 'number' },
      { key: 'addressSection', label: 'Adresse', type: 'section' },
      { key: 'address', label: 'Adresse', layout: { span: 'full' }, type: 'text' },
      { key: 'zip', label: 'Code postal', type: 'text' },
      { key: 'city', label: 'Ville', type: 'text' },
      { default: 'FR', key: 'country', label: 'Pays', options: COUNTRIES, type: 'select' },
      { key: 'optionsSection', label: 'Options', type: 'section' },
      { default: true, key: 'onsite', label: 'Passages sur site autorisés', type: 'checkbox' },
      {
        default: true,
        description: 'Un centre inactif n’apparaît plus dans les imports',
        key: 'active',
        label: 'Actif',
        type: 'checkbox',
      },
    ],
    header: {
      description: 'Lieu physique de passage, rattaché à un compte et synchronisé avec VTest.',
      eyebrow: 'Centre de test',
      title: 'Nouveau centre de test',
    },
    modal: { size: 'lg' },
  })
}

export function locationFormSchema() {
  return defineFormSchema({
    actions: ACTIONS,
    fields: [
      { key: 'locationSection', label: 'Location', type: 'section' },
      { key: 'name', label: 'Nom', required: true, type: 'text' },
      {
        default: 'internal',
        key: 'type',
        label: 'Type',
        options: [
          { label: 'Interne', value: 'internal' },
          { label: 'Partenaire', value: 'partner' },
        ],
        type: 'select',
      },
      {
        icon: 'i-lucide-target',
        key: 'vtestId',
        label: 'VTEST ID',
        layout: { span: 'full' },
        mono: true,
        required: true,
        type: 'text',
      },
    ],
    header: {
      description: 'Entité VTest qui pilote un ensemble de centres et de comptes.',
      eyebrow: 'Manager location',
      title: 'Nouvelle manager location',
    },
  })
}

export function memoFormSchema(accounts: readonly Account[], contacts: readonly Contact[]) {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Créer le fil' },
    ],
    fields: [
      { key: 'threadSection', label: 'Fil', type: 'section' },
      {
        key: 'account',
        label: 'Compte',
        options: accountOptions(accounts),
        placeholder: 'Rechercher un compte',
        required: true,
        type: 'select',
      },
      {
        default: 'progress',
        key: 'type',
        label: 'Type',
        options: [
          { label: 'Suivi de projet', value: 'progress' },
          { label: 'Plan d’action interne', value: 'plan' },
          { label: 'Incident', value: 'incident' },
          { label: 'Suivi commercial', value: 'commercial' },
        ],
        required: true,
        type: 'select',
      },
      {
        key: 'title',
        label: 'Titre',
        layout: { span: 'full' },
        placeholder: 'Sessions 2026 – 2027',
        required: true,
        type: 'text',
      },
      { key: 'visibilitySection', label: 'Visibilité', type: 'section' },
      {
        description: 'Le client ne voit pas ce fil',
        key: 'internal',
        label: 'Interne à ExAssess',
        type: 'checkbox',
      },
      { default: true, key: 'notify', label: 'Notifier les participants', type: 'checkbox' },
      {
        key: 'participants',
        label: 'Participants',
        layout: { span: 'full' },
        multiple: true,
        options: contactOptions(contacts),
        placeholder: 'Ajouter un participant',
        type: 'select',
      },
      { key: 'messageSection', label: 'Premier message', type: 'section' },
      {
        key: 'message',
        layout: { span: 'full' },
        placeholder: 'Écrivez le premier message… **gras** pris en charge',
        rows: 4,
        type: 'textarea',
      },
    ],
    header: {
      description:
        'Un fil de discussion rattaché à un compte, interne à l’équipe ou partagé avec le client.',
      eyebrow: 'Mémo de compte',
      title: 'Nouveau mémo',
    },
    modal: { size: 'lg' },
  })
}
