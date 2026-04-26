import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('credits, total_purchased')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data ?? { credits: 0, total_purchased: 0 })
}
