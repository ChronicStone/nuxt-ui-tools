import { defineFormSchema } from '#ui-tools/form'

import type { Account } from '../data/accounts'
import { ACCOUNT_TYPE } from '../data/enums'
import { accountOptions } from './pickers'

const TEMPLATES = [
  {
    description: '5 questions · 4 obligatoires · 23 envois',
    label: 'Attestation Qualiopi 2026',
    value: 't1',
  },
  {
    description: '3 questions · 3 obligatoires · 41 envois',
    label: 'KBIS et RIB à jour',
    value: 't2',
  },
  {
    description: '4 questions · 3 obligatoires · 12 envois',
    label: 'Contacts facturation',
    value: 't3',
  },
  {
    description: '3 questions · 2 obligatoires · 8 envois',
    label: 'Planning des sessions T4',
    value: 't4',
  },
]

const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE).map(([value, label]) => ({
  label,
  value,
}))

const DEADLINES = [
  { label: '7 jours', value: '7' },
  { label: '14 jours', value: '14' },
  { label: '30 jours', value: '30' },
  { label: '60 jours', value: '60' },
  { label: '90 jours', value: '90' },
]

const ACCESS_LEVELS = [
  { label: 'Lecture et écriture', value: 'write' },
  { label: 'Lecture seule', value: 'read' },
]

const REMINDER_OPTIONS = [
  { label: 'À 40 % du délai', value: '40' },
  { label: 'À 75 % du délai', value: '75' },
  { label: 'À 90 % du délai', value: '90' },
]

const RECIPIENT_MODES = [
  { description: 'Business Manager, représentant légal, facturation', label: 'Référents du compte', value: 'all' },
  { label: 'Business Manager uniquement', value: 'bm' },
]

export function sendDemandFormSchema(accounts: readonly Account[]) {
  return defineFormSchema({
    actions: [{ key: 'cancel', label: 'Annuler' }, { key: 'submit', label: 'Envoyer la demande' }],
    fields: [
      { key: 'templateSection', label: 'Modèle', type: 'section' },
      {
        default: 't1',
        help: 'Le questionnaire envoyé au compte',
        key: 'template',
        label: 'Modèle',
        layout: { span: 'full' },
        options: TEMPLATES,
        required: true,
        type: 'radio-card',
      },
      { key: 'recipientsSection', label: 'Destinataires', type: 'section' },
      {
        default: 'accounts',
        key: 'mode',
        label: 'Comptes destinataires',
        options: [
          { label: 'Comptes choisis', value: 'accounts' },
          { label: 'Tous les comptes actifs', value: 'all' },
          { label: 'Par type de compte', value: 'type' },
        ],
        props: { orientation: 'horizontal' },
        required: true,
        type: 'radio',
      },
      {
        condition: ({ deps }) => deps.mode === 'accounts',
        dependencies: ['mode'],
        key: 'accounts',
        label: 'Comptes',
        layout: { span: 'full' },
        options: accountOptions(accounts),
        placeholder: 'Ajouter un compte',
        props: { multiple: true },
        type: 'select',
      },
      {
        condition: ({ deps }) => deps.mode === 'type',
        dependencies: ['mode'],
        key: 'accountTypes',
        label: 'Types de compte',
        options: ACCOUNT_TYPE_OPTIONS,
        props: { multiple: true },
        type: 'select',
      },
      {
        condition: ({ deps }) => deps.mode === 'type',
        default: 'active',
        dependencies: ['mode'],
        key: 'accountStatus',
        label: 'Statut',
        options: [{ label: 'Actifs', value: 'active' }, { label: 'Tous', value: 'any' }],
        type: 'select',
      },
      {
        default: 'all',
        help: 'Personnes destinataires',
        key: 'recipientMode',
        label: 'Destinataires du compte',
        options: RECIPIENT_MODES,
        type: 'radio',
      },
      { key: 'scheduleSection', label: 'Délai et relances', type: 'section' },
      {
        default: '30',
        help: 'Le compte voit l’échéance dans son espace',
        key: 'deadline',
        label: 'Échéance',
        options: DEADLINES,
        required: true,
        type: 'select',
      },
      {
        default: 'write',
        help: 'Lien sécurisé par jeton, sans compte requis',
        key: 'access',
        label: 'Accès',
        options: ACCESS_LEVELS,
        type: 'select',
      },
      {
        default: ['40', '75', '90'],
        key: 'reminders',
        label: 'Rappels automatiques',
        layout: { span: 'full' },
        options: REMINDER_OPTIONS,
        type: 'checkbox-group',
      },
      {
        default:
          'Bonjour,\n\nDans le cadre du suivi de votre habilitation, merci de compléter ce questionnaire avant l’échéance indiquée.',
        help: 'Ajouté à l’e-mail initial et repris dans les rappels.',
        key: 'message',
        label: 'Message d’accompagnement',
        layout: { span: 'full' },
        props: { rows: 4 },
        type: 'textarea',
      },
    ],
    header: {
      description:
        'Choisissez un modèle, les comptes destinataires, puis le délai. Une demande est créée par compte.',
      eyebrow: 'Demandes d’information',
      title: 'Envoyer une demande',
    },
    modal: { size: 'xl' },
  })
}
