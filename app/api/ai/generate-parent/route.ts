import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/client'
import { buildParentVersionPrompt } from '@/lib/ai/prompts'
import { validatePlanContent } from '@/lib/ai/validator'

export async function POST(req: NextRequest) {
  try {
    const { leadId, provider } = await req.json()
    const supabase = await createClient()

    const [leadRes, profileRes, latestPlanRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('student_profiles').select('*').eq('lead_id', leadId).single(),
      supabase.from('study_plans').select('content_json').eq('lead_id', leadId)
        .eq('plan_type', 'student').order('created_at', { ascending: false }).limit(1).single(),
    ])

    const lead = leadRes.data
    if (!lead) return NextResponse.json({ error: '学生不存在' }, { status: 404 })

    const studentPlanJson = latestPlanRes.data
      ? JSON.stringify(latestPlanRes.data.content_json)
      : JSON.stringify({ background_summary: `学生 ${lead.student_name}`, target: lead.target_country?.join(', ') })

    const { system, user } = buildParentVersionPrompt(studentPlanJson, 'zh')
    const result = await generateText(provider || 'claude', 'main', system, user)

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 返回格式错误，请重试')

    const parentSection = JSON.parse(jsonMatch[0])
    const validation = validatePlanContent(JSON.stringify(parentSection))

    const baseContent = latestPlanRes.data?.content_json || {}
    const content = { ...baseContent, parent_section: parentSection }

    return NextResponse.json({ content, riskFlags: validation.violations })
  } catch (e: any) {
    console.error('generate-parent error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
