import { defineFormSchema } from '#ui-tools/form'

const LANGUAGES = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
]

const THEMES = [
  { label: 'Système', value: 'system' },
  { label: 'Clair', value: 'light' },
  { label: 'Sombre', value: 'dark' },
]

const TIMEZONES = [
  { label: 'Europe/Paris', value: 'Europe/Paris' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'America/New_York', value: 'America/New_York' },
]

const HOME_PAGES = [
  { label: 'Tableau de bord', value: 'dashboard' },
  { label: 'Comptes', value: 'accounts' },
  { label: 'Demandes d’information', value: 'demands' },
]

const DIGEST_FREQUENCIES = [
  { label: 'Quotidien, 8 h', value: 'daily-8' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Jamais', value: 'never' },
]

const NOTIFY_EVENTS = [
  { default: true, key: 'notifyExports', label: 'Exports prêts' },
  { default: true, key: 'notifyDemands', label: 'Demandes d’information soumises' },
  { default: true, key: 'notifyMemoReplies', label: 'Réponses dans mes mémos' },
  { default: true, key: 'notifyContractSignatures', label: 'Signatures de contrat' },
  { default: false, key: 'notifyOverdueInvoices', label: 'Factures en retard' },
]

export function profileFormSchema() {
  return defineFormSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Enregistrer' },
    ],
    fields: [
      {
        key: 'profile',
        tabs: [
          {
            fields: [
              { key: 'identitySection', label: 'Identité', type: 'section' },
              { key: 'firstName', label: 'Prénom', required: true, type: 'text' },
              { key: 'lastName', label: 'Nom', required: true, type: 'text' },
              {
                disabled: () => true,
                key: 'email',
                label: 'E-mail',
                layout: { span: 'full' },
                type: 'text',
              },
              { key: 'preferencesSection', label: 'Préférences', type: 'section' },
              { key: 'language', label: 'Langue', options: LANGUAGES, type: 'select' },
              { key: 'theme', label: 'Thème', options: THEMES, type: 'select' },
              { key: 'timezone', label: 'Fuseau horaire', options: TIMEZONES, type: 'select' },
              {
                key: 'homePage',
                label: 'Page d’accueil',
                options: HOME_PAGES,
                type: 'select',
              },
            ],
            key: 'p',
            label: 'Profil',
          },
          {
            fields: [
              { key: 'passwordSection', label: 'Mot de passe', type: 'section' },
              {
                key: 'currentPassword',
                label: 'Mot de passe actuel',
                placeholder: '••••••••',
                props: { visibilityToggle: true },
                type: 'password',
              },
              {
                help: '12 caractères minimum',
                key: 'newPassword',
                label: 'Nouveau mot de passe',
                props: { visibilityToggle: true },
                type: 'password',
              },
              {
                key: 'newPasswordConfirmation',
                label: 'Confirmation',
                props: { visibilityToggle: true },
                type: 'password',
              },
            ],
            key: 's',
            label: 'Sécurité',
          },
          {
            fields: [
              { key: 'digestSection', label: 'Résumé par e-mail', type: 'section' },
              {
                default: 'daily-8',
                key: 'digestFrequency',
                label: 'Fréquence',
                options: DIGEST_FREQUENCIES,
                type: 'select',
              },
              { key: 'notifySection', label: 'Me notifier pour', type: 'section' },
              ...NOTIFY_EVENTS.map((event) => ({
                default: event.default,
                key: event.key,
                label: event.label,
                type: 'checkbox' as const,
              })),
            ],
            key: 'n',
            label: 'Notifications',
          },
        ],
        type: 'tabs',
      },
    ],
    header: {
      eyebrow: 'Mon compte',
      title: 'Profil et préférences',
    },
    modal: { size: 'lg' },
  })
}

export const profileFormInput = {
  email: 'it@exassess.com',
  firstName: 'Cyprien',
  homePage: 'dashboard',
  language: 'fr',
  lastName: 'Thao',
  theme: 'system',
  timezone: 'Europe/Paris',
}
