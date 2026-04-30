'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TEMPLATES } from '@/lib/templates'

type Tab = 'build' | 'improve' | 'test' | 'templates' | 'history'
type Model = 'claude-sonnet-4-6' | 'claude-opus-4-7' | 'claude-haiku-4-5-20251001'

interface WizardAnswers {
  goal: string; role: string; audience: string; format: string
  tones: string[]; constraints: string[]; constraintNote: string
  context: string; example: string
}
const DEFAULT_W: WizardAnswers = {
  goal: '', role: '', audience: '', format: '',
  tones: [], constraints: [], constraintNote: '', context: '', example: ''
}

interface ImproveResult {
  score_original: number; analyse: string
  dimensions: { clarte: number; contexte: number; specificite: number; format_sortie: number; contraintes: number }
  prompt_ameliore: string; style_utilise: string; ameliorations: string[]
  variante_concise: string; variante_avancee: string; conseils: string; score_ameliore: number
}
interface BuildResult { prompt: string; titre: string; score: number; points_forts: string[]; conseil: string }
interface HistoryItem { id: string; type: string; original_prompt: string; result: BuildResult | ImproveResult; credits_used: number; created_at: string }

const AUDIENCE = ['Grand public', 'Professionnels', 'Experts techniques', 'Direction / C-level', 'Équipe interne', 'Clients', 'Étudiants']
const FORMATS = [
  { label: '📝 Texte libre', v: 'texte libre' }, { label: '📋 Liste à puces', v: 'liste à puces' },
  { label: '📊 Tableau markdown', v: 'tableau markdown' }, { label: '{ } JSON structuré', v: 'JSON structuré' },
  { label: '📄 Rapport formaté', v: 'rapport avec sections' }, { label: '📧 Email', v: 'email professionnel' },
  { label: '🔢 Étapes numérotées', v: 'étapes numérotées' }, { label: '💬 Réponse concise', v: 'réponse concise' },
]
const CONSTRAINTS = ['Moins de 200 mots', 'Moins de 500 mots', 'Ton formel', 'Ton informel', "Pas d'anglais", 'Sans jargon technique', 'Avec exemples concrets', 'Citer les sources', 'Éviter les généralités']
const TONES = ['Professionnel', 'Neutre et factuel', 'Pédagogique', 'Dynamique', 'Empathique', 'Synthétique', 'Détaillé']
const USE_CASES = [
  { v: 'general', l: 'Général' }, { v: 'marketing', l: 'Marketing' }, { v: 'technical', l: 'Technique' },
  { v: 'creative', l: 'Créatif' }, { v: 'analysis', l: 'Analyse' }, { v: 'support', l: 'Support client' },
]
const STYLES = [
  { v: 'structure', l: '🏗️ Structuré (XML)' }, { v: 'expert', l: '🎓 Expert (persona)' },
  { v: 'fewshot', l: '💡 Few-shot (exemples)' }, { v: 'concise', l: '⚡ Concis' },
]

function getRoleSuggestions(goal: string) {
  const g = goal.toLowerCase()
  if (g.match(/code|développ|programm|logiciel/)) return ['Développeur senior', 'Architecte logiciel', 'DevOps expert', 'Ingénieur full-stack']
  if (g.match(/rédact|écrir|contenu|article|blog/)) return ['Rédacteur expert', 'Journaliste professionnel', 'Copywriter SEO', 'Expert en communication']
  if (g.match(/analys|rapport|données|statistique/)) return ['Analyste stratégique', 'Data scientist', 'Consultant senior', 'Expert en recherche']
  if (g.match(/vente|market|client|commercial/)) return ['Expert en marketing', 'Consultant commercial', 'Spécialiste CRM', 'Growth hacker']
  if (g.match(/juridiq|contrat|légal|droit/)) return ['Juriste expert', 'Avocat spécialisé', 'Conseiller juridique', 'Notaire']
  if (g.match(/form|enseign|pédagog|cours/)) return ['Formateur expert', 'Pédagogue senior', 'Coach professionnel', 'Enseignant spécialisé']
  return ['Expert en la matière', 'Consultant senior', 'Spécialiste métier', 'Professionnel expérimenté']
}

function computePreview(a: WizardAnswers) {
  const l: string[] = []
  if (a.role) { l.push(`Tu es ${a.role}.`); l.push('') }
  if (a.goal) { l.push('## Objectif'); l.push(a.goal) }
  const c = [...a.constraints, ...(a.constraintNote ? [a.constraintNote] : [])]
  if (a.audience || a.format || c.length || a.tones.length) {
    l.push(''); l.push('## Paramètres')
    if (a.audience) l.push(`- **Audience :** ${a.audience}`)
    if (a.format) l.push(`- **Format :** ${a.format}`)
    if (a.tones.length) l.push(`- **Ton :** ${a.tones.join(', ')}`)
    if (c.length) { l.push('- **Contraintes :**'); c.forEach(x => l.push(`  - ${x}`)) }
  }
  if (a.example) { l.push(''); l.push('## Exemple'); l.push(a.example) }
  if (a.context) { l.push(''); l.push('## Contexte'); l.push(a.context) }
  return l.join('\n')
}
function computeScore(a: WizardAnswers) {
  let s = 0
  if (a.goal.trim()) s += 30; if (a.role.trim()) s += 20; if (a.audience) s += 10
  if (a.format) s += 15; if (a.tones.length) s += 5
  if (a.constraints.length || a.constraintNote.trim()) s += 10
  if (a.example.trim()) s += 5; if (a.context.trim()) s += 5
  return Math.min(s, 100)
}

function ScoreBar({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const col = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className={`bg-slate-800 rounded-full overflow-hidden ${size === 'lg' ? 'h-3' : 'h-1.5'}`}>
      <div className={`h-full ${col} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  )
}

function CopyBtn({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000) }}
      className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5">
      {ok ? '✓ Copié !' : label}
    </button>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${active ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
      {label}
    </button>
  )
}

function FileUploadBtn({ onLoad, label = '📎 Charger un fichier' }: {
  onLoad: (content: string, filename: string) => void
  label?: string
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      let content = ev.target?.result as string
      if (file.name.match(/\.html?$/i)) {
        const tmp = document.createElement('div')
        tmp.innerHTML = content
        content = tmp.textContent || tmp.innerText || content
      }
      onLoad(content.trim(), file.name)
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  return (
    <label className="cursor-pointer text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 w-fit">
      {label}
      <input type="file" accept=".txt,.html,.htm,.md,.csv" onChange={handleChange} className="hidden" />
    </label>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('build')
  const [credits, setCredits] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [model, setModel] = useState<Model>('claude-sonnet-4-6')

  // Wizard
  const [wStep, setWStep] = useState(0)
  const [wAnswers, setWAnswers] = useState<WizardAnswers>(DEFAULT_W)
  const [wLoading, setWLoading] = useState(false)
  const [wResult, setWResult] = useState<BuildResult | null>(null)
  const [wError, setWError] = useState('')

  // Improve
  const [iPrompt, setIPrompt] = useState('')
  const [iUseCase, setIUseCase] = useState('general')
  const [iStyle, setIStyle] = useState('structure')
  const [iLoading, setILoading] = useState(false)
  const [iResult, setIResult] = useState<ImproveResult | null>(null)
  const [iError, setIError] = useState('')
  const [iVariant, setIVariant] = useState<'main' | 'concise' | 'advanced'>('main')

  // Test
  const [tSystem, setTSystem] = useState('')
  const [tMessage, setTMessage] = useState('')
  const [tLoading, setTLoading] = useState(false)
  const [tResult, setTResult] = useState<{ response: string; usage: { input: number; output: number } } | null>(null)
  const [tError, setTError] = useState('')

  // History
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [hLoading, setHLoading] = useState(false)
  const [hExpanded, setHExpanded] = useState<string | null>(null)

  const wPreview = useMemo(() => computePreview(wAnswers), [wAnswers])
  const wScore = useMemo(() => computeScore(wAnswers), [wAnswers])

  useEffect(() => {
    fetch('/api/credits').then(r => r.json()).then(d => setCredits(d.credits ?? 0))
    supabase.auth.getUser().then(({ data: { user } }) => { if (user?.email) setUserEmail(user.email) })
  }, [])

  useEffect(() => {
    if (tab === 'history' && history.length === 0) loadHistory()
  }, [tab])

  async function loadHistory() {
    setHLoading(true)
    const d = await fetch('/api/history').then(r => r.json())
    setHistory(Array.isArray(d) ? d : [])
    setHLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function deductCredit() {
    setCredits(c => c !== null ? Math.max(0, c - 1) : null)
  }

  function handleNoCredits() {
    setCredits(0); router.push('/buy')
  }

  // Wizard
  async function handleBuild() {
    setWLoading(true); setWError('')
    try {
      const r = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: wAnswers, model })
      }).then(r => r.json())
      if (r.error) { if (r.error.includes('Crédits')) handleNoCredits(); else setWError(r.error) }
      else { setWResult(r); deductCredit() }
    } catch { setWError('Erreur réseau') }
    setWLoading(false)
  }

  function resetWizard() { setWStep(0); setWAnswers(DEFAULT_W); setWResult(null); setWError('') }

  // Improve
  async function handleImprove() {
    if (!iPrompt.trim()) return
    setILoading(true); setIError(''); setIResult(null); setIVariant('main')
    try {
      const r = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: iPrompt, use_case: iUseCase, style: iStyle, model })
      }).then(r => r.json())
      if (r.error) { if (r.error.includes('Crédits')) handleNoCredits(); else setIError(r.error) }
      else { setIResult(r); deductCredit() }
    } catch { setIError('Erreur réseau') }
    setILoading(false)
  }

  // Test
  async function handleTest() {
    if (!tMessage.trim()) return
    setTLoading(true); setTError(''); setTResult(null)
    try {
      const r = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: tSystem || undefined, message: tMessage, model })
      }).then(r => r.json())
      if (r.error) { if (r.error.includes('Crédits')) handleNoCredits(); else setTError(r.error) }
      else { setTResult(r); deductCredit() }
    } catch { setTError('Erreur réseau') }
    setTLoading(false)
  }

  async function deleteHistory(id: string) {
    await fetch('/api/history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setHistory(h => h.filter(x => x.id !== id))
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'build', label: '🧱 Construire' },
    { id: 'improve', label: '✨ Améliorer' },
    { id: 'test', label: '🧪 Tester' },
    { id: 'templates', label: '📚 Templates' },
    { id: 'history', label: '🕐 Historique' },
  ]

  const WIZARD_STEPS = [
    { title: 'Quel est votre objectif principal ?', sub: "Décrivez ce que vous voulez accomplir — plus c'est précis, mieux c'est" },
    { title: "Quel rôle doit jouer l'IA ?", sub: 'Définir un persona expert améliore significativement les résultats' },
    { title: 'À qui est destiné le résultat ?', sub: 'Le public cible influence le niveau de langage et les détails' },
    { title: 'Quel format de sortie souhaitez-vous ?', sub: 'Spécifier le format évite les réponses vagues et désordonnées' },
    { title: 'Quelles contraintes à respecter ?', sub: 'Les contraintes cadrent la réponse et évitent les hors-sujet' },
    { title: 'Avez-vous des exemples à fournir ?', sub: 'Les exemples few-shot améliorent significativement la précision (optionnel)' },
    { title: 'Quel est le ton souhaité ?', sub: 'Le ton affecte le style de communication' },
    { title: 'Contexte ou informations supplémentaires ?', sub: 'Partagez tout contexte utile pour finaliser le prompt (optionnel)' },
  ]

  const scoreBadge = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">PB</div>
          <span className="font-bold text-white hidden sm:block">PromptBuilder <span className="text-indigo-400">Pro</span></span>
        </div>

        <div className="flex items-center gap-3">
          {/* Model selector */}
          <select value={model} onChange={e => setModel(e.target.value as Model)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="claude-sonnet-4-6">Sonnet (recommandé)</option>
            <option value="claude-opus-4-7">Opus (max qualité)</option>
            <option value="claude-haiku-4-5-20251001">Haiku (rapide)</option>
          </select>

          {/* Credits */}
          <div className="flex items-center gap-2">
            {credits !== null && (
              <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${credits <= 2 ? 'bg-red-900/30 border border-red-500/30 text-red-300' : 'bg-slate-800 text-slate-300'}`}>
                {credits <= 2 && '⚠️ '}
                <span className="font-bold text-white">{credits}</span>
                <span className="text-slate-500 text-xs ml-1">crédits</span>
              </div>
            )}
            <Link href="/buy" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              + Recharger
            </Link>
          </div>

          {/* User / logout */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden md:block">{userEmail}</span>
            <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1.5">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Low credits banner */}
      {credits === 0 && (
        <div className="bg-red-900/20 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
          <p className="text-red-300 text-sm">Vous n'avez plus de crédits. Rechargez pour continuer à utiliser PromptBuilder Pro.</p>
          <Link href="/buy" className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-2 rounded-lg ml-4 flex-shrink-0">
            Acheter 500 crédits — 19,99€
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 px-4 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${tab === t.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">

        {/* ═══════════════ BUILD TAB ═══════════════ */}
        {tab === 'build' && (
          <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: wizard or result */}
            <div>
              {!wResult ? (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                  {/* Step progress */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1">
                      {WIZARD_STEPS.map((_, i) => (
                        <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i < wStep ? 'bg-indigo-500' : i === wStep ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{wStep + 1} / {WIZARD_STEPS.length}</span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-1">{WIZARD_STEPS[wStep].title}</h2>
                  <p className="text-sm text-slate-400 mb-5">{WIZARD_STEPS[wStep].sub}</p>

                  {/* Step 0: Goal */}
                  {wStep === 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <FileUploadBtn onLoad={(content) => setWAnswers(a => ({ ...a, goal: content }))} label="📎 Charger un document" />
                      </div>
                      <textarea value={wAnswers.goal} onChange={e => setWAnswers(a => ({ ...a, goal: e.target.value }))}
                        placeholder="Ex: Analyser des contrats, rédiger des emails de prospection, générer des idées de contenu..."
                        rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none" />
                      <p className="text-xs text-slate-500">💡 Le document doit décrire votre besoin ou projet</p>
                    </div>
                  )}

                  {/* Step 1: Role */}
                  {wStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {getRoleSuggestions(wAnswers.goal).map(s => (
                          <Chip key={s} label={s} active={wAnswers.role === s}
                            onClick={() => setWAnswers(a => ({ ...a, role: a.role === s ? '' : s }))} />
                        ))}
                      </div>
                      <input value={wAnswers.role} onChange={e => setWAnswers(a => ({ ...a, role: e.target.value }))}
                        placeholder="Ou saisissez un rôle personnalisé..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">💡 Le document doit décrire le rôle ou la fiche de poste</p>
                        <FileUploadBtn onLoad={(content) => setWAnswers(a => ({ ...a, role: content.split('\n')[0].slice(0, 100) }))} label="📎 Charger une fiche de poste" />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Audience */}
                  {wStep === 2 && (
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCE.map(a => (
                        <Chip key={a} label={a} active={wAnswers.audience === a}
                          onClick={() => setWAnswers(ans => ({ ...ans, audience: ans.audience === a ? '' : a }))} />
                      ))}
                    </div>
                  )}

                  {/* Step 3: Format */}
                  {wStep === 3 && (
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATS.map(f => (
                        <button key={f.v} onClick={() => setWAnswers(a => ({ ...a, format: a.format === f.v ? '' : f.v }))}
                          className={`px-3 py-2.5 rounded-xl text-sm text-left transition-colors border ${wAnswers.format === f.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Step 4: Constraints */}
                  {wStep === 4 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {CONSTRAINTS.map(c => (
                          <Chip key={c} label={c} active={wAnswers.constraints.includes(c)}
                            onClick={() => setWAnswers(a => ({
                              ...a, constraints: a.constraints.includes(c)
                                ? a.constraints.filter(x => x !== c) : [...a.constraints, c]
                            }))} />
                        ))}
                      </div>
                      <input value={wAnswers.constraintNote}
                        onChange={e => setWAnswers(a => ({ ...a, constraintNote: e.target.value }))}
                        placeholder="Autre contrainte spécifique..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">💡 Le document doit lister des règles ou contraintes à respecter</p>
                        <FileUploadBtn onLoad={(content) => setWAnswers(a => ({ ...a, constraintNote: content }))} label="📎 Charger des contraintes" />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Example (optional) */}
                  {wStep === 5 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">💡 Le document doit être un exemple de résultat attendu</p>
                        <FileUploadBtn onLoad={(content) => setWAnswers(a => ({ ...a, example: content }))} label="📎 Charger un exemple" />
                      </div>
                      <textarea value={wAnswers.example} onChange={e => setWAnswers(a => ({ ...a, example: e.target.value }))}
                        placeholder="Ex: Entrée : [texte client]\nSortie attendue : [résumé en 3 points]..."
                        rows={5} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none" />
                      <p className="text-xs text-slate-500">Laissez vide pour passer cette étape</p>
                    </div>
                  )}

                  {/* Step 6: Tone */}
                  {wStep === 6 && (
                    <div className="flex flex-wrap gap-2">
                      {TONES.map(t => (
                        <Chip key={t} label={t} active={wAnswers.tones.includes(t)}
                          onClick={() => setWAnswers(a => ({
                            ...a, tones: a.tones.includes(t) ? a.tones.filter(x => x !== t) : [...a.tones, t]
                          }))} />
                      ))}
                    </div>
                  )}

                  {/* Step 7: Context (optional) */}
                  {wStep === 7 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">💡 Le document doit fournir le contexte du projet (cahier des charges, notes...)</p>
                        <FileUploadBtn onLoad={(content) => setWAnswers(a => ({ ...a, context: content }))} label="📎 Charger un document" />
                      </div>
                      <textarea value={wAnswers.context} onChange={e => setWAnswers(a => ({ ...a, context: e.target.value }))}
                        placeholder="Secteur d'activité, outil utilisé, contraintes techniques, public spécifique..."
                        rows={5} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none" />
                      <p className="text-xs text-slate-500">Laissez vide pour terminer sans contexte supplémentaire</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={() => wStep > 0 && setWStep(s => s - 1)} disabled={wStep === 0}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-0 transition-colors">
                      ← Retour
                    </button>
                    {wStep < 7 ? (
                      <button onClick={() => setWStep(s => s + 1)}
                        disabled={wStep === 0 && !wAnswers.goal.trim()}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm">
                        Suivant →
                      </button>
                    ) : (
                      <button onClick={handleBuild} disabled={wLoading || !wAnswers.goal.trim() || credits === 0}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2">
                        {wLoading
                          ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Génération...</>
                          : '✨ Générer le prompt'}
                      </button>
                    )}
                  </div>
                  {wError && <p className="text-red-400 text-sm mt-3">{wError}</p>}
                </div>
              ) : (
                // Build result
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">{wResult.titre}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-2xl font-bold ${scoreBadge(wResult.score)}`}>{wResult.score}</span>
                        <span className="text-slate-500 text-sm">/ 100</span>
                      </div>
                    </div>
                    <button onClick={resetWizard} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 border border-slate-700 rounded-lg">
                      Nouveau prompt
                    </button>
                  </div>

                  <ScoreBar score={wResult.score} size="lg" />

                  <div className="bg-slate-950 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Prompt généré</span>
                      <CopyBtn text={wResult.prompt} />
                    </div>
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{wResult.prompt}</pre>
                  </div>

                  {wResult.points_forts?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Points forts</p>
                      <ul className="space-y-1">
                        {wResult.points_forts.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {wResult.conseil && (
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-indigo-400 mb-1">💡 Conseil</p>
                      <p className="text-sm text-slate-300">{wResult.conseil}</p>
                    </div>
                  )}

                  <button onClick={() => { setTMessage(wResult.prompt); setTab('test') }}
                    className="w-full border border-slate-700 hover:border-slate-500 text-slate-300 text-sm py-2.5 rounded-xl transition-colors">
                    Tester ce prompt →
                  </button>
                </div>
              )}
            </div>

            {/* Right: live preview */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300">Aperçu en temps réel</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${scoreBadge(wScore)}`}>{wScore}</span>
                    <span className="text-slate-600 text-xs">/ 100</span>
                  </div>
                </div>
                <ScoreBar score={wScore} size="lg" />
                <div className="mt-4 bg-slate-950 rounded-xl p-4 min-h-[200px]">
                  {wPreview ? (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{wPreview}</pre>
                  ) : (
                    <p className="text-slate-600 text-sm">L'aperçu de votre prompt apparaîtra ici au fur et à mesure que vous répondez aux questions.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Progression</p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Objectif', done: !!wAnswers.goal },
                    { label: 'Rôle de l\'IA', done: !!wAnswers.role },
                    { label: 'Audience', done: !!wAnswers.audience },
                    { label: 'Format', done: !!wAnswers.format },
                    { label: 'Contraintes', done: wAnswers.constraints.length > 0 || !!wAnswers.constraintNote },
                    { label: 'Exemples', done: !!wAnswers.example, optional: true },
                    { label: 'Ton', done: wAnswers.tones.length > 0 },
                    { label: 'Contexte', done: !!wAnswers.context, optional: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={item.done ? 'text-slate-300' : 'text-slate-600'}>
                        {item.label}
                        {item.optional && <span className="text-slate-700 text-xs ml-1">(optionnel)</span>}
                      </span>
                      <span className={item.done ? 'text-green-400' : 'text-slate-700'}>{item.done ? '✓' : '○'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ IMPROVE TAB ═══════════════ */}
        {tab === 'improve' && (
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Améliorer un prompt existant</h2>
              <p className="text-slate-400 text-sm mb-5">Collez votre prompt — l'IA l'analyse, le score, et vous livre une version optimisée</p>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Collez votre prompt ou chargez un fichier</span>
                <FileUploadBtn onLoad={(content, name) => setIPrompt(content)} label="📎 Charger un fichier" />
              </div>
              <textarea value={iPrompt} onChange={e => setIPrompt(e.target.value)}
                placeholder="Collez ici votre prompt à améliorer..."
                rows={6} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none mb-4" />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Cas d'usage</label>
                  <div className="flex flex-wrap gap-1.5">
                    {USE_CASES.map(u => (
                      <button key={u.v} onClick={() => setIUseCase(u.v)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors border ${iUseCase === u.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                        {u.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Style d'optimisation</label>
                  <div className="flex flex-col gap-1.5">
                    {STYLES.map(s => (
                      <button key={s.v} onClick={() => setIStyle(s.v)}
                        className={`px-3 py-1.5 rounded-lg text-xs text-left transition-colors border ${iStyle === s.v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {iError && <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{iError}</div>}

              <button onClick={handleImprove} disabled={iLoading || !iPrompt.trim() || credits === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {iLoading
                  ? <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analyse en cours...</>
                  : '✨ Analyser et améliorer — 1 crédit'}
              </button>
            </div>

            {iResult && (
              <div className="space-y-4">
                {/* Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                    <p className="text-xs text-slate-500 mb-2">Score original</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-4xl font-black ${scoreBadge(iResult.score_original)}`}>{iResult.score_original}</span>
                      <span className="text-slate-600 mb-1">/ 100</span>
                    </div>
                    <ScoreBar score={iResult.score_original} size="lg" />
                  </div>
                  <div className="bg-slate-900 border border-green-500/20 rounded-2xl p-5">
                    <p className="text-xs text-slate-500 mb-2">Score amélioré</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-4xl font-black ${scoreBadge(iResult.score_ameliore)}`}>{iResult.score_ameliore}</span>
                      <span className="text-slate-600 mb-1">/ 100</span>
                      <span className="text-green-400 text-sm mb-1">+{iResult.score_ameliore - iResult.score_original}</span>
                    </div>
                    <ScoreBar score={iResult.score_ameliore} size="lg" />
                  </div>
                </div>

                {/* Analysis */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Analyse</p>
                  <p className="text-sm text-slate-300 mb-4">{iResult.analyse}</p>
                  <div className="space-y-2">
                    {Object.entries(iResult.dimensions).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-28 capitalize">{k.replace('_', ' ')}</span>
                        <div className="flex-1"><ScoreBar score={v} /></div>
                        <span className="text-xs text-slate-400 w-8 text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improved prompt with variants */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {(['main', 'concise', 'advanced'] as const).map(v => (
                        <button key={v} onClick={() => setIVariant(v)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${iVariant === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                          {v === 'main' ? '✨ Principal' : v === 'concise' ? '⚡ Concis' : '🔧 Avancé'}
                        </button>
                      ))}
                    </div>
                    <CopyBtn text={iVariant === 'main' ? iResult.prompt_ameliore : iVariant === 'concise' ? iResult.variante_concise : iResult.variante_avancee} />
                  </div>
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-slate-950 rounded-xl p-4">
                    {iVariant === 'main' ? iResult.prompt_ameliore : iVariant === 'concise' ? iResult.variante_concise : iResult.variante_avancee}
                  </pre>
                </div>

                {/* Improvements + tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Améliorations apportées</p>
                    <ul className="space-y-2">
                      {iResult.ameliorations.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-indigo-400 flex-shrink-0">→</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">💡 Style utilisé · {iResult.style_utilise}</p>
                    <p className="text-sm text-slate-300">{iResult.conseils}</p>
                  </div>
                </div>

                <button onClick={() => { setTMessage(iResult.prompt_ameliore); setTab('test') }}
                  className="w-full border border-slate-700 hover:border-slate-500 text-slate-300 text-sm py-2.5 rounded-xl transition-colors">
                  Tester le prompt amélioré →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TEST TAB ═══════════════ */}
        {tab === 'test' && (
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Sandbox de test</h2>
              <p className="text-slate-400 text-sm mb-5">Testez vos prompts directement et voyez la réponse réelle de l'IA</p>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400">System prompt <span className="text-slate-600">(optionnel)</span></label>
                    <FileUploadBtn onLoad={(content) => setTSystem(content)} label="📎 Fichier" />
                  </div>
                  <textarea value={tSystem} onChange={e => setTSystem(e.target.value)}
                    placeholder="Instructions système pour l'IA (rôle, comportement global)..."
                    rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400">Votre prompt</label>
                    <FileUploadBtn onLoad={(content) => setTMessage(content)} label="📎 Fichier" />
                  </div>
                  <textarea value={tMessage} onChange={e => setTMessage(e.target.value)}
                    placeholder="Entrez ou collez votre prompt ici..."
                    rows={6} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none" />
                </div>
              </div>

              {tError && <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{tError}</div>}

              <button onClick={handleTest} disabled={tLoading || !tMessage.trim() || credits === 0}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {tLoading
                  ? <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi en cours...</>
                  : '🧪 Tester — 1 crédit'}
              </button>
            </div>

            {tResult && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-300">Réponse de l'IA</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600">
                      {tResult.usage.input} tokens entrée · {tResult.usage.output} tokens sortie
                    </span>
                    <CopyBtn text={tResult.response} />
                  </div>
                </div>
                <div className="bg-slate-950 rounded-xl p-4">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{tResult.response}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TEMPLATES TAB ═══════════════ */}
        {tab === 'templates' && (
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Templates prêts à l'emploi</h2>
              <p className="text-slate-400 text-sm">15 templates optimisés par des experts en prompt engineering. Copiez et personnalisez.</p>
              <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                <span className="text-sm text-slate-400">📎 Charger un fichier pour le tester ou l'améliorer :</span>
                <FileUploadBtn onLoad={(content) => { setTMessage(content); setTab('test') }} label="Tester un fichier" />
                <FileUploadBtn onLoad={(content) => { setIPrompt(content); setTab('improve') }} label="Améliorer un fichier" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((t, i) => (
                <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-indigo-400 font-medium">{t.category}</span>
                      <h3 className="font-semibold text-white text-sm mt-0.5">{t.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 flex-1">{t.description}</p>
                  <div className="flex gap-2">
                    <CopyBtn text={t.prompt} label="Copier le prompt" />
                    <button onClick={() => { setTMessage(t.prompt); setTab('test') }}
                      className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
                      Tester
                    </button>
                    <button onClick={() => { setIPrompt(t.prompt); setTab('improve') }}
                      className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
                      Améliorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ HISTORY TAB ═══════════════ */}
        {tab === 'history' && (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Historique</h2>
                <p className="text-slate-400 text-sm">Vos 50 dernières générations</p>
              </div>
              <button onClick={loadHistory} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 border border-slate-700 rounded-lg">
                Rafraîchir
              </button>
            </div>

            {hLoading && <p className="text-slate-500 text-sm">Chargement...</p>}

            {!hLoading && history.length === 0 && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12 text-center">
                <p className="text-slate-500 text-sm">Aucun prompt généré pour l'instant.<br />Commencez par l'onglet 🧱 Construire ou ✨ Améliorer !</p>
              </div>
            )}

            <div className="space-y-3">
              {history.map(item => {
                const isExpanded = hExpanded === item.id
                const typeLabel = item.type === 'build' ? '🧱 Wizard' : item.type === 'improve' ? '✨ Améliorer' : '🧪 Test'
                const score = item.type === 'build'
                  ? (item.result as BuildResult).score
                  : item.type === 'improve' ? (item.result as ImproveResult).score_ameliore : null

                return (
                  <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                      onClick={() => setHExpanded(isExpanded ? null : item.id)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-400 flex-shrink-0">{typeLabel}</span>
                        <p className="text-sm text-slate-300 truncate">{item.original_prompt}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        {score !== null && <span className={`text-sm font-bold ${scoreBadge(score)}`}>{score}</span>}
                        <span className="text-xs text-slate-600">{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className="text-slate-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-800 pt-4">
                        {item.type === 'build' && (
                          <div className="space-y-3">
                            <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-slate-950 rounded-xl p-4">
                              {(item.result as BuildResult).prompt}
                            </pre>
                            <div className="flex gap-2">
                              <CopyBtn text={(item.result as BuildResult).prompt} />
                              <button onClick={() => { setTMessage((item.result as BuildResult).prompt); setTab('test') }}
                                className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 rounded-lg transition-colors">
                                Tester
                              </button>
                            </div>
                          </div>
                        )}
                        {item.type === 'improve' && (
                          <div className="space-y-3">
                            <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-slate-950 rounded-xl p-4">
                              {(item.result as ImproveResult).prompt_ameliore}
                            </pre>
                            <div className="flex gap-2">
                              <CopyBtn text={(item.result as ImproveResult).prompt_ameliore} />
                              <button onClick={() => { setTMessage((item.result as ImproveResult).prompt_ameliore); setTab('test') }}
                                className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 rounded-lg transition-colors">
                                Tester
                              </button>
                            </div>
                          </div>
                        )}
                        <button onClick={() => deleteHistory(item.id)}
                          className="mt-3 text-xs text-red-500 hover:text-red-400 transition-colors">
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
