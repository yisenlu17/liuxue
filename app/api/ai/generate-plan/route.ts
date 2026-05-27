import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/client'
import { buildStudyPlanPrompt } from '@/lib/ai/prompts'
import { validatePlanContent } from '@/lib/ai/validator'

export async function POST(req: NextRequest) {
  try {
    const { leadId, provider, planType } = await req.json()
    const supabase = await createClient()

    const [leadRes, profileRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('student_profiles').select('*').eq('lead_id', leadId).single(),
    ])

    const lead = leadRes.data
    const profile = profileRes.data || {}
    if (!lead) return NextResponse.json({ error: '学生不存在' }, { status: 404 })

    const { system, user } = buildStudyPlanPrompt(profile, lead, {}, 'zh')
    const result = await generateText(provider || 'claude', 'main', system, user)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 返回格式错误，请重试')

    const content = JSON.parse(jsonMatch[0])
    const validation = validatePlanContent(JSON.stringify(content))

    return NextResponse.json({
      content,
      riskFlags: validation.violations,
    })
  } catch (e: any) {
    console.error('generate-plan error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
