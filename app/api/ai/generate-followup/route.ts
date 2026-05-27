import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/client'
import { buildFollowUpPrompt } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { studentName, channel, messageType, tone, provider, planSummary } = await req.json()
    const { system, user } = buildFollowUpPrompt(studentName, channel, messageType, tone, 'zh', planSummary)
    const message = await generateText(provider || 'claude', 'fast', system, user)
    return NextResponse.json({ message: message.trim() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
