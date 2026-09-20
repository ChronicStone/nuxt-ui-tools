import { defineFormSchema } from '#ui-tools/form'

export function loginFormSchema() {
  return defineFormSchema({
    actions: [{ icon: 'i-lucide-arrow-right', key: 'submit', label: 'Se connecter' }],
    fields: [
      {
        key: 'email',
        label: 'Adresse e-mail',
        props: { icon: 'i-lucide-user', inputType: 'email' },
        required: true,
        type: 'text',
      },
      {
        key: 'password',
        label: 'Mot de passe',
        props: { visibilityToggle: true },
        required: true,
        type: 'password',
      },
      { default: true, key: 'remember', label: 'Rester connecté', type: 'checkbox' },
    ],
    header: {
      description: 'Espace administrateur ExAssess.',
      title: 'Connexion',
    },
  })
}
