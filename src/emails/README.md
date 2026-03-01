# Templates email QUANTUM

3 templates à coller dans **Supabase Dashboard → Authentication → Email Templates**.

| Fichier | Template Supabase |
|---|---|
| `confirm-signup.html` | **Confirm signup** |
| `reset-password.html` | **Reset Password** |
| `change-email.html` | **Change Email Address** |

## Comment les appliquer

1. Ouvrir [Supabase Dashboard](https://app.supabase.com) → votre projet
2. Aller dans **Authentication** → **Email Templates** (sidebar gauche)
3. Sélectionner le template concerné
4. Coller le contenu HTML du fichier dans le champ **Body**
5. Laisser le champ **Subject** tel quel ou personnaliser :
   - Confirm signup : `Confirmez votre inscription – QUANTUM`
   - Reset Password : `Réinitialisation de votre mot de passe – QUANTUM`
   - Change Email : `Confirmez votre nouvelle adresse – QUANTUM`
6. Cliquer **Save**

## Variable utilisée

`{{ .ConfirmationURL }}` — injectée automatiquement par Supabase avec l'URL d'action signée.
