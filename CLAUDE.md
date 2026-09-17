# PromptBuilder Pro — Guide Claude Code

## Stack

- **Next.js 14** App Router, TypeScript (`"strict": false`)
- **Supabase** SSR (cookie-based auth) + service_role pour les crons
- **Stripe** — paiement par crédits
- **Anthropic** — Claude claude-opus-4-5 pour toutes les générations
- **hCaptcha** — protection anti-bot sur login et register
- **Vercel** — déploiement + crons

URL production : `https://promptbuilder-saas.vercel.app`

---

## Lancer localement

```bash
cd "C:\Users\franc\LOGICIELS\PromptBuilder"
npm run dev
```

Variables d'environnement requises dans `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Architecture

### Répertoires clés

| Chemin | Rôle |
|---|---|
| `app/dashboard/page.tsx` | Interface principale (onglets Améliorer / Construire / Tester / Templates / Historique) |
| `app/auth/` | Login, register, reset-password, update-password |
| `app/api/improve/` | Route API — amélioration de prompt |
| `app/api/build/` | Route API — construction de prompt étape par étape |
| `app/api/test/` | Route API — test de prompt |
| `app/api/templates/` | Route API — prompts templates |
| `app/api/history/` | Route API — historique des prompts |
| `app/api/credits/` | Route API — lecture des crédits utilisateur |
| `app/api/stripe/` | Checkout + webhook Stripe |
| `app/api/cron/keepalive/` | Cron Vercel — ping quotidien Supabase |
| `lib/supabase/server.ts` | `createClient()` (SSR) + `createServiceClient()` (service_role) |
| `lib/anthropic.ts` | Client Anthropic + `getAnthropicErrorMessage()` |
| `lib/stripe.ts` | Client Stripe |

### Tables Supabase

- **`profiles`** — `id`, `credits`, `total_purchased`
- **`prompt_history`** — historique des prompts générés par utilisateur

### Auth flow

1. Supabase SSR (cookies) — sessions côté serveur
2. hCaptcha obligatoire sur `/auth/register` et `/auth/login` (sitekey `51d4897c-0a56-433e-8a7c-0c5855b21e3e`)
3. Email de confirmation requis à l'inscription
4. Reset de mot de passe : `/auth/reset-password` → email → `/auth/update-password`

### Crédits

- 2 crédits offerts à l'inscription
- Achat via Stripe (paiement unique, pas d'abonnement)
- 1 crédit consommé par appel API (améliorer, construire, tester)

---

## Crons Vercel

Configurés dans `vercel.json` :

| Endpoint | Heure (UTC) | Rôle |
|---|---|---|
| `/api/cron/keepalive` | 07:00 | Ping Supabase pour éviter la mise en pause (plan gratuit) |

---

## PWA

- `public/manifest.json` — manifest PWA (icône SVG uniquement)
- `public/icon.svg` — icône SVG de l'app
- `public/sw.js` — service worker (network-first, cache minimal)
- `app/icon.tsx` — favicon 32×32 via ImageResponse
- `app/apple-icon.tsx` — icône iOS 180×180 via ImageResponse

---

## Anti-abus

- Supabase Rate Limits : 3 inscriptions / 5 min par IP
- Supabase Attack Protection : hCaptcha activé
- Anthropic Spending Limit configuré sur le dashboard Anthropic
- Erreurs Anthropic humanisées via `getAnthropicErrorMessage()` dans `lib/anthropic.ts`
