import { createClient } from '@/lib/supabase/server'
import { anthropic, BUILD_SYSTEM_PROMPT, parseJSON, getAnthropicErrorMessage } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('credits').eq('id', user.id).single()

  if (!profile || profile.credits < 1)
    return NextResponse.json({ error: 'Crédits insuffisants. Achetez un pack pour continuer.' }, { status: 402 })

  const { answers, model = 'claude-sonnet-4-6' } = await req.json()
  if (!answers?.goal?.trim()) return NextResponse.json({ error: 'Objectif requis' }, { status: 400 })

  const lines = ['Réponses au questionnaire guidé :']
  if (answers.goal) lines.push(`\nOBJECTIF : ${answers.goal}`)
  if (answers.role) lines.push(`RÔLE DE L'IA : ${answers.role}`)
  if (answers.audience) lines.push(`AUDIENCE : ${answers.audience}`)
  if (answers.format) lines.push(`FORMAT : ${answers.format}`)
  if (answers.tones?.length) lines.push(`TON : ${answers.tones.join(', ')}`)
  const constraints = [...(answers.constraints ?? []), ...(answers.constraintNote ? [answers.constraintNote] : [])]
  if (constraints.length) lines.push(`CONTRAINTES : ${constraints.join(' | ')}`)
  if (answers.context) lines.push(`CONTEXTE : ${answers.context}`)
  if (answers.example) lines.push(`EXEMPLE IDÉAL :\n${answers.example}`)

  let text = ''
  try {
    const resp = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: BUILD_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: lines.join('\n') + '\n\nGénère le prompt en JSON.' }]
    })
    text = (resp.content[0] as { text: string }).text
    const result = parseJSON(text)

    await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id)
    await supabase.from('prompt_history').insert({
      user_id: user.id, type: 'build',
      original_prompt: `[Wizard] ${answers.goal}`.slice(0, 500),
      result, credits_used: 1
    })

    return NextResponse.json(result)
  } catch (e: unknown) {
    if (text) return NextResponse.json({ error: 'Réponse non JSON', raw: text.slice(0, 200) }, { status: 500 })
    return NextResponse.json({ error: getAnthropicErrorMessage(e) }, { status: 500 })
  }
}
