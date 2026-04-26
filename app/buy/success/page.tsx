import Link from 'next/link'

export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-900/30 border border-green-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-3">Paiement confirmé !</h1>
        <p className="text-slate-400 mb-2">500 crédits ont été ajoutés à votre compte.</p>
        <p className="text-slate-500 text-sm mb-8">Ils sont valables à vie et cumulables avec vos futurs achats.</p>
        <Link href="/dashboard"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          Accéder à mon espace →
        </Link>
      </div>
    </div>
  )
}
