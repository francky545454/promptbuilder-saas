import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()
  await supabase.from('profiles').select('id').limit(1)
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}
