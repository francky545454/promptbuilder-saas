import { createClient } from '@/lib/supabase/server'
import { anthropic, IMPROVE_SYSTEM_PROMPT, parseJSON, getAnthropicErrorMessage } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('credits').eq('id', user.id).single()

  if (!profile || profile.credits < 1)
    return NextResponse.json({ error: 'Crédits insuffisants. Achetez un pack pour continuer.' }, { status: 402 })

  const { prompt, use_case, style, model = 'claude-sonnet-4-6' } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt vide' }, { status: 400 })

  let text = ''
  try {
    const resp = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: IMPROVE_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Améliore ce prompt.\nCas d'usage : ${use_case}\nStyle : ${style}\n\n<prompt_original>\n${prompt}\n</prompt_original>`
      }]
    })
    text = (resp.content[0] as { text: string }).text
    const result = parseJSON(text)

    await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id)
    await supabase.from('prompt_history').insert({
      user_id: user.id, type: 'improve',
      original_prompt: prompt.slice(0, 500),
      result, credits_used: 1
    })

    return NextResponse.json(result)
  } catch (e: unknown) {
    if (text) return NextResponse.json({ error: 'Réponse non JSON', raw: text.slice(0, 200) }, { status: 500 })
    return NextResponse.json({ error: getAnthropicErrorMessage(e) }, { status: 500 })
  }
}
