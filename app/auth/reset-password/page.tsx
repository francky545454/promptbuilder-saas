'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/update-password`
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-indigo-900/30 border border-indigo-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📧</div>
          <h1 className="text-2xl font-bold text-white mb-3">Email envoyé</h1>
          <p className="text-slate-400 mb-2">Un lien de réinitialisation a été envoyé à</p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <p className="text-slate-500 text-sm mb-8">Cliquez sur le lien dans l'email pour choisir un nouveau mot de passe. Vérifiez vos spams si vous ne le recevez pas.</p>
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">PB</div>
            <span className="font-bold text-white">PromptBuilder <span className="text-indigo-400">Pro</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-slate-400 text-sm mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
