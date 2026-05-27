import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/client'
import { buildMaterialsChecklistPrompt } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { targetCountry, targetLevel, targetMajor, provider } = await req.json()
    const { system, user } = buildMaterialsChecklistPrompt(targetCountry || [], targetLevel || 'master', targetMajor || '', 'zh')
    const result = await generateText(provider || 'claude', 'fast', system, user)
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('AI 返回格式错误')
    const materials = JSON.parse(jsonMatch[0])
    return NextResponse.json({ materials })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
