import { defineFormSchema } from '#ui-tools/form'

import type { Account } from '../data/accounts'
import { accountOptions } from './pickers'

const TERRITORIES = [
  { label: 'France', value: 'FR' },
  { label: 'Europe', value: 'EU' },
  { label: 'International', value: 'INTL' },
]

const PRODUCT_LINES = [
  { label: 'English General', value: 'english-general' },
  { label: 'English Professional', value: 'english-pro' },
  { label: 'Français Langue Étrangère', value: 'fle' },
]

const CURRENCIES = [
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
  { label: 'CHF', value: 'CHF' },
]

const PAYMENT_TERMS = [
  { label: '15 jours', value: '15' },
  { label: '30 jours', value: '30' },
  { label: '45 jours', value: '45' },
  { label: '60 jours', value: '60' },
]

const AGENTS = [
  { label: 'Camille Martin', value: 'camille-martin' },
  { label: 'Yanis Fontaine', value: 'yanis-fontaine' },
]

const VERSIONS = [
  { label: 'v4.2', value: 'v4.2' },
  { label: 'v4.1', value: 'v4.1' },
]

const DOC_TYPES = [
  { label: 'Convention commerciale', value: 'SALES_AGREEMENT' },
  { label: 'Accord de sous-traitance', value: 'SUB_PROCESSING_AGREEMENT' },
  { label: 'Avenant', value: 'SALES_AGREEMENT_AMENDMENT' },
  { label: 'Autre', value: 'OTHER' },
]

export function contractFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      {
        icon: 'i-lucide-check',
        key: 'submit',
        label: 'Enregistrer et passer en signature',
      },
    ],
    fields: [
      { key: 'generalSection', label: 'Général', type: 'section' },
      {
        key: 'account',
        label: 'Compte',
        options: accountOptions(accounts),
        placeholder: 'Rechercher un compte',
        required: true,
        type: 'select',
      },
      {
        key: 'po',
        label: 'Référence bon de commande',
        placeholder: 'BC-2026-042',
        type: 'text',
      },
      {
        key: 'start',
        label: 'Date de début',
        props: { icon: 'i-lucide-calendar' },
        required: true,
        type: 'date',
      },
      {
        help: 'Doit suivre la date de début',
        key: 'end',
        label: 'Date de fin',
        props: { icon: 'i-lucide-calendar' },
        required: true,
        type: 'date',
      },
      {
        help: 'Rappel « À suivre » 90 jours avant',
        key: 'renew',
        label: 'Échéance de renouvellement',
        props: { icon: 'i-lucide-calendar' },
        type: 'date',
      },
      {
        key: 'territory',
        label: 'Territoire',
        options: TERRITORIES,
        required: true,
        type: 'select',
      },
      {
        help: 'Filtre les produits proposés ci-dessous',
        key: 'productLine',
        label: 'Ligne de produits',
        options: PRODUCT_LINES,
        required: true,
        type: 'select',
      },
      {
        default: 'EUR',
        key: 'currency',
        label: 'Devise',
        options: CURRENCIES,
        required: true,
        type: 'select',
      },
      {
        default: '30',
        key: 'paymentTerm',
        label: 'Conditions de paiement',
        options: PAYMENT_TERMS,
        type: 'select',
      },
      {
        help: 'Un agent apporte l’affaire et perçoit une commission sur les factures',
        key: 'hasAgent',
        label: 'Agent commercial',
        type: 'checkbox',
      },
      {
        condition: ({ deps }) => 'hasAgent' in deps && deps.hasAgent === true,
        dependencies: ['hasAgent'],
        key: 'agent',
        label: 'Agent',
        options: AGENTS,
        type: 'select',
      },
      {
        condition: ({ deps }) => 'hasAgent' in deps && deps.hasAgent === true,
        dependencies: ['hasAgent'],
        key: 'agentRate',
        label: 'Taux de commission',
        props: { controls: false, min: 0, suffix: '%' },
        type: 'number',
      },
      { key: 'productsSection', label: 'Produits', type: 'section' },
      {
        addItemLabel: 'Ajouter un produit',
        fields: [
          {
            key: 'product',
            label: 'Produit',
            options: PRODUCT_LINES,
            required: true,
            type: 'select',
          },
          {
            key: 'version',
            label: 'Version',
            layout: { width: 120 },
            options: VERSIONS,
            props: { mono: true },
            type: 'select',
          },
          {
            key: 'cost',
            label: 'Coût unitaire',
            layout: { width: 130 },
            props: { controls: false, min: 0, suffix: '€' },
            type: 'number',
          },
          {
            key: 'price',
            label: 'Prix unitaire',
            layout: { width: 130 },
            props: { controls: false, min: 0, suffix: '€' },
            type: 'number',
          },
          {
            default: true,
            key: 'active',
            label: 'Actif',
            layout: { width: 90 },
            type: 'checkbox',
          },
        ],
        key: 'products',
        type: 'array-table',
      },
      {
        key: 'targetsSection',
        label: 'Objectifs de consommation',
        type: 'section',
      },
      {
        addItemLabel: 'Ajouter un objectif',
        fields: [
          { key: 'label', label: 'Libellé', placeholder: 'Année 1', type: 'text' },
          {
            key: 'commit',
            label: 'Engagement',
            props: { controls: false, min: 0, suffix: 'tests' },
            type: 'number',
          },
          { key: 'from', label: 'Du', type: 'date' },
          { key: 'to', label: 'Au', type: 'date' },
        ],
        key: 'targets',
        label: 'Périodes',
        layout: { span: 'full' },
        props: { draggable: false },
        type: 'array-list',
      },
      { key: 'docsSection', label: 'Documents', type: 'section' },
      {
        addItemLabel: 'Ajouter un document',
        fields: [
          {
            key: 'docType',
            label: 'Type de document',
            options: DOC_TYPES,
            required: true,
            type: 'select',
          },
          { key: 'file', label: 'Fichier', props: { accept: 'application/pdf' }, type: 'file' },
        ],
        description: 'Trois documents maximum. Un type déjà utilisé n’est plus proposé.',
        key: 'docs',
        label: 'Pièces jointes',
        layout: { span: 'full' },
        props: { draggable: false },
        type: 'array-list',
      },
    ],
    header: {
      description: 'Enregistré en brouillon, envoyé en signature quand la checklist est complète.',
      eyebrow: 'Contrats',
      title: 'Nouveau contrat',
    },
    modal: { size: 'lg' },
  })
}
