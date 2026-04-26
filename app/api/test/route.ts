import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('credits').eq('id', user.id).single()

  if (!profile || profile.credits < 1)
    return NextResponse.json({ error: 'Crédits insuffisants.' }, { status: 402 })

  const { system, message, model = 'claude-sonnet-4-6' } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  try {
    const kwargs: Parameters<typeof anthropic.messages.create>[0] = {
      model, max_tokens: 4096,
      messages: [{ role: 'user', content: message }]
    }
    if (system) kwargs.system = system

    const resp = await anthropic.messages.create(kwargs)

    await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id)

    return NextResponse.json({
      response: (resp.content[0] as { text: string }).text,
      usage: { input: resp.usage.input_tokens, output: resp.usage.output_tokens }
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
