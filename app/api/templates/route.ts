import { TEMPLATES } from '@/lib/templates'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(TEMPLATES)
}
