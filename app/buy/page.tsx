'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Buy() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy() {
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/stripe/checkout', { method: 'POST' }).then(r => r.json())
      if (r.error) throw new Error(r.error)
      window.location.href = r.url
    } catch (e: unknown) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← Retour au dashboard</Link>
          <h1 className="text-2xl font-bold text-white mt-4">Recharger vos crédits</h1>
        </div>

        <div className="bg-gradient-to-b from-indigo-900/30 to-slate-900 border border-indigo-500/40 rounded-2xl p-8">
          <div className="text-center mb-6">
            <p className="text-indigo-300 text-sm font-medium mb-1">Pack Pro</p>
            <p className="text-5xl font-extrabold text-white">19,99€</p>
            <p className="text-slate-400 text-sm mt-1">500 prompts · valable à vie · sans abonnement</p>
          </div>

          <ul className="space-y-2 mb-8">
            {['500 améliorations ou générations de prompts', 'Wizard guidé en 8 étapes', 'Améliorateur avec analyse complète', 'Sandbox de test intégré', 'Compatible Claude, GPT-4, Gemini', 'Historique sauvegardé', 'Crédits cumulables'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-green-400 flex-shrink-0">✓</span>{f}
              </li>
            ))}
          </ul>

          {error && <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

          <button onClick={handleBuy} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors text-lg flex items-center justify-center gap-2">
            {loading ? (<><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirection vers Stripe...</>) : '💳 Payer 19,99€ en toute sécurité'}
          </button>
          <p className="text-xs text-slate-600 text-center mt-3">Paiement sécurisé · Stripe · Remboursement 7 jours</p>
        </div>
      </div>
    </div>
  )
}
