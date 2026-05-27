import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/client'
import { buildExtractBackgroundPrompt } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { rawText, provider } = await req.json()
    if (!rawText?.trim()) return NextResponse.json({ error: '请提供文本' }, { status: 400 })

    const { system, user } = buildExtractBackgroundPrompt(rawText)
    const result = await generateText(provider || 'claude', 'fast', system, user)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 返回格式错误')

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({ extracted })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
