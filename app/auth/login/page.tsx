'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<HCaptcha>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaToken) { setError('Veuillez compléter la vérification anti-robot'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken('')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">PB</div>
            <span className="font-bold text-white">PromptBuilder <span className="text-indigo-400">Pro</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Connexion</h1>
          <p className="text-slate-400 text-sm mt-1">Accédez à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"/>
          </div>
          <div className="flex justify-center">
            <HCaptcha
              sitekey="2dd0b74a-6e92-4820-a454-2a92a40af2b2"
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              ref={captchaRef}
              theme="dark"
            />
          </div>
          <button type="submit" disabled={loading || !captchaToken}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">Inscription gratuite</Link>
        </p>
      </div>
    </div>
  )
}
