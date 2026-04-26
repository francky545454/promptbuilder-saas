import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromptBuilder Pro — Créez des prompts IA de niveau expert',
  description: 'Guidé pas à pas, créez des prompts exceptionnels pour Claude, GPT-4 et Gemini. 5 prompts gratuits à l\'inscription.',
  keywords: 'prompt engineering, IA, ChatGPT, Claude, Gemini, prompt builder',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-slate-200 antialiased">{children}</body>
    </html>
  )
}
