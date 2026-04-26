import Link from 'next/link'

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* NAV */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">PB</div>
          <span className="font-bold text-white">PromptBuilder <span className="text-indigo-400">Pro</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors">Connexion</Link>
          <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-indigo-900/30 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs text-indigo-300 font-medium mb-6">
          ✨ 5 prompts gratuits à l'inscription — aucune carte requise
        </div>
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
          Créez des prompts IA<br />
          <span className="text-indigo-400">de niveau expert</span><br />
          en 2 minutes
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Guidé pas à pas par un assistant intelligent. Compatible Claude, GPT‑4 et Gemini.
          Fini les résultats décevants — obtenez exactement ce que vous voulez.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-indigo-900/40">
            Commencer gratuitement →
          </Link>
          <Link href="/auth/login"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            J'ai déjà un compte
          </Link>
        </div>
        <p className="text-xs text-slate-600 mt-4">5 prompts gratuits · Pas de carte bancaire · Résultats immédiats</p>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-3">Trois outils en un</h2>
        <p className="text-slate-400 text-center mb-12">Tout ce qu'il faut pour maîtriser le prompt engineering</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🧱', title: 'Wizard guidé', desc: '8 questions simples pour construire un prompt parfait depuis zéro. Aperçu en temps réel. Score de qualité instantané.', tag: 'Le plus populaire' },
            { icon: '✨', title: 'Améliorateur', desc: 'Collez n\'importe quel prompt existant. L\'IA l\'analyse, le score, et vous livre une version optimisée avec explications.', tag: null },
            { icon: '🧪', title: 'Sandbox de test', desc: 'Testez vos prompts directement sans quitter l\'app. Voyez la réponse réelle et le nombre de tokens utilisés.', tag: null },
          ].map(f => (
            <div key={f.title} className="bg-slate-900 rounded-2xl border border-slate-700 p-6 relative">
              {f.tag && <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">{f.tag}</div>}
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-900/50 border-y border-slate-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Comment ça fonctionne</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: '1', title: 'Décrivez votre besoin', desc: 'En langage naturel, sans jargon technique' },
              { n: '2', title: 'Répondez aux questions', desc: '6 à 8 questions guidées pour préciser votre objectif' },
              { n: '3', title: 'Voyez le prompt se construire', desc: 'Aperçu en temps réel avec score de qualité' },
              { n: '4', title: 'Copiez et utilisez', desc: 'Directement dans Claude, ChatGPT ou Gemini' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white mx-auto mb-3">{s.n}</div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Tarif simple et transparent</h2>
        <p className="text-slate-400 mb-12">Payez à l'usage, sans abonnement, sans surprise</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8">
            <p className="text-slate-400 text-sm font-medium mb-2">Découverte</p>
            <p className="text-4xl font-extrabold text-white mb-1">Gratuit</p>
            <p className="text-slate-500 text-sm mb-6">Pour toujours</p>
            <ul className="space-y-2 text-sm text-slate-300 text-left mb-8">
              {['5 prompts offerts à l\'inscription', 'Wizard guidé complet', 'Améliorateur + Testeur', '15 templates inclus'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/auth/register" className="block w-full border border-slate-600 hover:border-slate-400 text-slate-200 font-semibold py-3 rounded-xl transition-colors">
              Commencer
            </Link>
          </div>
          <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900 rounded-2xl border border-indigo-500/50 p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">RECOMMANDÉ</div>
            <p className="text-indigo-300 text-sm font-medium mb-2">Pack Pro</p>
            <p className="text-4xl font-extrabold text-white mb-1">19,99€</p>
            <p className="text-slate-400 text-sm mb-6">500 prompts · valable à vie</p>
            <ul className="space-y-2 text-sm text-slate-300 text-left mb-8">
              {['500 améliorations ou générations', 'Accès aux 3 outils', 'Modèles Opus, Sonnet, Haiku', 'Historique complet', 'Support prioritaire'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/auth/register" className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
              Acheter maintenant
            </Link>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-6">Paiement sécurisé par Stripe · CB, Visa, Mastercard · Facture disponible</p>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            { q: 'Qu\'est-ce qu\'un "prompt" ?', a: 'Un prompt est le message ou l\'instruction que vous envoyez à une IA comme Claude ou ChatGPT. Un bon prompt = une bonne réponse. Un prompt vague = une réponse décevante.' },
            { q: 'Les 500 prompts expirent-ils ?', a: 'Non, jamais. Vos crédits sont valables à vie, sans date d\'expiration.' },
            { q: 'Avec quels outils IA est-ce compatible ?', a: 'Les prompts générés sont universels : Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), et tous les LLM compatibles.' },
            { q: 'Puis-je acheter plusieurs packs ?', a: 'Oui, chaque achat ajoute 500 crédits à votre solde existant.' },
            { q: 'Comment fonctionne le remboursement ?', a: 'Si vous n\'êtes pas satisfait dans les 7 jours, contactez-nous pour un remboursement complet, sans question.' },
          ].map(faq => (
            <details key={faq.q} className="bg-slate-900 border border-slate-700 rounded-xl group">
              <summary className="px-5 py-4 cursor-pointer font-medium text-slate-200 list-none flex items-center justify-between">
                {faq.q}
                <span className="text-slate-500 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
        <div className="flex justify-center gap-6 mb-3">
          <a href="#" className="hover:text-slate-400 transition-colors">CGV</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Mentions légales</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Politique de confidentialité</a>
          <a href="mailto:contact@promptbuilder.pro" className="hover:text-slate-400 transition-colors">Contact</a>
        </div>
        <p>© 2025 PromptBuilder Pro · Paiements sécurisés par Stripe</p>
      </footer>
    </div>
  )
}
