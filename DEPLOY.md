# PromptBuilder Pro — Guide de déploiement

## Prérequis

- Compte Supabase : https://supabase.com
- Compte Stripe : https://stripe.com
- Compte Vercel : https://vercel.com
- Node.js 18+ installé localement

---

## Étape 1 — Supabase : créer le projet et la base de données

### 1.1 Créer le projet

1. Allez sur https://supabase.com/dashboard
2. Cliquez **New project**
3. Choisissez un nom (ex: `promptbuilder-pro`), un mot de passe fort, région **eu-west-1** (Paris)
4. Attendez ~2 minutes que le projet s'initialise

### 1.2 Créer le schéma

1. Dans le menu gauche : **Database → SQL Editor → New query**
2. Copiez-collez tout le contenu de `supabase-schema.sql`
3. Cliquez **Run** — vous devriez voir "Success"

### 1.3 Récupérer les clés

Dans **Settings → API** :

| Variable | Où la trouver |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |

### 1.4 Configurer l'authentification

1. **Authentication → Settings → Auth**
2. Laissez **Confirm email** activé (c'est la valeur par défaut — ne désactivez pas)
3. Définissez **Site URL** : `https://votre-domaine.vercel.app`
4. Ajoutez dans **Redirect URLs** : `https://votre-domaine.vercel.app/**`

> ✅ **Sécurité anti-abus** : la vérification email empêche la création de faux comptes en masse pour obtenir des crédits gratuits. Un email non vérifié ne peut pas se connecter.

---

## Étape 2 — Stripe : créer le produit et le webhook

### 2.1 Créer le produit

1. Allez sur https://dashboard.stripe.com/products
2. Cliquez **+ Add product**
3. Nom : `Pack 500 Prompts`
4. Prix : `19,99 €` — type **One time** (pas d'abonnement)
5. Sauvegardez — notez le **Price ID** (commence par `price_...`)

### 2.2 Mettre à jour le Price ID dans le code

Ouvrez `app/api/stripe/checkout/route.ts` et remplacez la ligne :
```typescript
price: process.env.STRIPE_PRICE_ID,
```
Vérifiez que votre `.env.local` contient bien `STRIPE_PRICE_ID=price_xxxxx`

### 2.3 Récupérer les clés Stripe

Dans **Developers → API keys** :

| Variable | Valeur |
|----------|--------|
| `STRIPE_SECRET_KEY` | Clé secrète (`sk_live_...` ou `sk_test_...`) |

### 2.4 Créer le webhook

1. **Developers → Webhooks → Add endpoint**
2. URL : `https://votre-domaine.vercel.app/api/stripe/webhook`
3. Events à écouter : `checkout.session.completed`
4. Cliquez **Add endpoint**
5. Récupérez le **Signing secret** (`whsec_...`)

| Variable | Valeur |
|----------|--------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |

---

## Étape 3 — Anthropic : récupérer la clé API et fixer un budget

1. Allez sur https://console.anthropic.com
2. **Settings → API Keys → Create Key**
3. Notez la clé (`sk-ant-...`)

| Variable | Valeur |
|----------|--------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

### 3.1 Fixer un budget mensuel (obligatoire)

1. Dans la console Anthropic : **Settings → Billing → Usage limits**
2. Activez **Monthly spend limit**
3. Fixez un montant raisonnable selon vos attentes — par exemple :
   - Phase de test : **20$** (suffisant pour ~1 400 appels Sonnet)
   - Lancement : **100$** (~7 000 appels)
   - À augmenter au fur et à mesure de vos revenus Stripe
4. Activez aussi les **alertes email** à 75% du budget

> ✅ **Sécurité critique** : si un bug survenait dans le décompte de crédits ou si vous subissiez une attaque, l'API Anthropic s'arrête automatiquement au plafond. Votre risque financier maximum est plafonné.

---

## Étape 4 — Vercel : déployer l'application

### 4.1 Pousser le code sur GitHub

```bash
# Dans le dossier PROMPTBUILDER-SAAS
git init
git add .
git commit -m "Initial commit"
gh repo create promptbuilder-saas --private --push
```

Ou créez le repo manuellement sur https://github.com/new puis :
```bash
git remote add origin https://github.com/VOTRE_USER/promptbuilder-saas.git
git push -u origin main
```

### 4.2 Importer sur Vercel

1. Allez sur https://vercel.com/new
2. Importez votre repo GitHub `promptbuilder-saas`
3. Framework détecté automatiquement : **Next.js**
4. Cliquez **Deploy** (va échouer — les variables d'env manquent)

### 4.3 Configurer les variables d'environnement

Dans Vercel → votre projet → **Settings → Environment Variables**, ajoutez :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role | All |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | All |
| `STRIPE_PRICE_ID` | Price ID Stripe (`price_...`) | All |
| `STRIPE_WEBHOOK_SECRET` | Signing secret webhook | All |
| `ANTHROPIC_API_KEY` | Clé API Anthropic | All |
| `NEXT_PUBLIC_APP_URL` | URL Vercel (`https://xxx.vercel.app`) | All |

### 4.4 Redéployer

Dans Vercel → **Deployments → ⋯ → Redeploy**

Votre app est maintenant en ligne sur `https://promptbuilder-saas-xxx.vercel.app`

---

## Étape 5 — Mettre à jour les URLs

### Supabase
Dans **Authentication → Settings** :
- Site URL : `https://votre-url.vercel.app`
- Redirect URLs : `https://votre-url.vercel.app/**`

### Stripe webhook
Si vous avez un domaine custom, mettez à jour l'URL du webhook dans Stripe.

---

## Étape 6 — Domaine personnalisé (optionnel)

1. Achetez un domaine (OVH, Namecheap, Gandi…)
2. Dans Vercel → **Settings → Domains** → ajoutez votre domaine
3. Configurez les DNS selon les instructions Vercel
4. Mettez à jour l'URL du webhook Stripe avec le domaine final
5. Mettez à jour Site URL dans Supabase

---

## Tester le déploiement

### Checklist complète

- [ ] Page d'accueil accessible (`/`)
- [ ] Inscription fonctionne (`/auth/register`) → vérifie que le profil est créé dans Supabase
- [ ] Connexion fonctionne (`/auth/login`) → redirige vers `/dashboard`
- [ ] Dashboard se charge, crédits affichés (5 par défaut)
- [ ] Onglet "Construire" : générer un prompt consomme 1 crédit
- [ ] Onglet "Améliorer" : fonctionne
- [ ] Onglet "Tester" : fonctionne
- [ ] Page `/buy` : clique sur "Payer" → redirige vers Stripe
- [ ] Paiement test Stripe (carte `4242 4242 4242 4242`) → 500 crédits ajoutés
- [ ] Page `/buy/success` s'affiche après paiement

### Tester le webhook Stripe en local

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Dans un autre terminal
npm run dev

# Simuler un paiement
stripe trigger checkout.session.completed
```

---

## Variables d'environnement — résumé

Créez un fichier `.env.local` à la racine pour le développement local :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ Ne committez jamais `.env.local` — il est déjà dans `.gitignore` par défaut avec Next.js.

---

## Commandes utiles

```bash
# Développement local
npm install
npm run dev          # http://localhost:3000

# Build de production (test local)
npm run build
npm start

# Vérifier les types TypeScript
npx tsc --noEmit
```

---

## Support

En cas de problème :
- Logs Vercel : Dashboard → Deployments → cliquer sur le déploiement → **Functions**
- Logs Supabase : Dashboard → **Database → Logs**
- Webhook Stripe : Dashboard → **Developers → Webhooks → votre endpoint → Logs**
