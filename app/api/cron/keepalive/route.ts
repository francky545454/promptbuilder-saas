import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Exécuté à chaque appel du cron (sinon Next.js le pré-calcule au build
// et Supabase n'est jamais réellement contacté).
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (e) {
    console.error('[keepalive]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
