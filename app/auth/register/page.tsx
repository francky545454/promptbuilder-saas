'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import Link from 'next/link'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<HCaptcha>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (!captchaToken) { setError('Veuillez compléter la vérification anti-robot'); return }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        emailRedirectTo: `${location.origin}/auth/callback`
      }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken('')
      return
    }
    if (data.session) {
      window.location.href = '/dashboard'
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-indigo-900/30 border border-indigo-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📧</div>
          <h1 className="text-2xl font-bold text-white mb-3">Vérifiez votre email</h1>
          <p className="text-slate-400 mb-2">Un lien de confirmation a été envoyé à</p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <p className="text-slate-500 text-sm mb-8">Cliquez sur le lien dans l'email pour activer votre compte et recevoir vos 2 crédits gratuits.</p>
          <p className="text-xs text-slate-600">Pas reçu ? Vérifiez vos spams ou{' '}
            <button onClick={() => setEmailSent(false)} className="text-indigo-400 hover:text-indigo-300 underline">
              réessayez
            </button>
          </p>
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
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-slate-400 text-sm mt-1">2 prompts gratuits — aucune carte requise</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg px-4 py-3 text-xs text-indigo-300">
            🎁 2 prompts offerts à l'inscription pour tester sans risque
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Mot de passe <span className="text-slate-600">(8 caractères min.)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"/>
          </div>
          <div className="flex justify-center">
            <HCaptcha
              sitekey="51d4897c-0a56-433e-8a7c-0c5855b21e3e"
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              ref={captchaRef}
              theme="dark"
            />
          </div>
          <button type="submit" disabled={loading || !captchaToken}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Création du compte...' : 'Créer mon compte gratuitement'}
          </button>
          <p className="text-xs text-slate-600 text-center">En vous inscrivant, vous acceptez nos CGV et notre politique de confidentialité.</p>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">Connexion</Link>
        </p>
      </div>
    </div>
  )
}
