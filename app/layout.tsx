import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromptBuilder Pro — Créez des prompts IA de niveau expert',
  description: 'Guidé pas à pas, créez des prompts exceptionnels pour Claude, GPT-4 et Gemini. 2 prompts gratuits à l\'inscription.',
  keywords: 'prompt engineering, IA, ChatGPT, Claude, Gemini, prompt builder',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PromptBuilder Pro',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-slate-950 text-slate-200 antialiased">
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`}
        </Script>
      </body>
    </html>
  )
}
