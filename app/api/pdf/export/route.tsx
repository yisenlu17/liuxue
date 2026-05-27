import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { StudyPlanContent, SchoolRecommendation } from '@/types'
import { DISCLAIMER_ZH, DISCLAIMER_EN } from '@/lib/ai/validator'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.5, color: '#1a1a1a' },
  watermark: { position: 'absolute', top: '40%', left: '10%', fontSize: 48, color: '#e5e7eb', transform: 'rotate(-35deg)', opacity: 0.4 },
  cover: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  orgName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
  coverTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 8 },
  coverSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  coverDate: { fontSize: 10, color: '#9ca3af', marginTop: 24 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', borderBottomWidth: 1, borderBottomColor: '#dbeafe', paddingBottom: 4, marginBottom: 8, color: '#1d4ed8' },
  bodyText: { fontSize: 10, lineHeight: 1.6, color: '#374151' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { backgroundColor: '#eff6ff', color: '#1d4ed8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 9 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1d4ed8', color: 'white', paddingVertical: 6, paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', paddingVertical: 5, paddingHorizontal: 4 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', paddingVertical: 5, paddingHorizontal: 4, backgroundColor: '#f9fafb' },
  colSchool: { flex: 2.5, fontSize: 9 },
  colTier: { flex: 1, fontSize: 9 },
  colFit: { flex: 0.8, fontSize: 9, textAlign: 'center' },
  colReason: { flex: 3, fontSize: 9 },
  tierBadge: { fontSize: 8, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, textAlign: 'center' },
  bulletItem: { flexDirection: 'row', marginTop: 4, gap: 6 },
  bulletDot: { fontSize: 10, color: '#1d4ed8', marginTop: 1 },
  disclaimer: { marginTop: 32, padding: 12, backgroundColor: '#fef9c3', borderRadius: 6, borderWidth: 0.5, borderColor: '#fbbf24' },
  disclaimerText: { fontSize: 8, color: '#92400e', lineHeight: 1.5 },
  contactBox: { marginTop: 24, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 6 },
  contactTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0369a1' },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 3 },
  contactLabel: { fontSize: 9, color: '#6b7280', width: 60 },
  contactValue: { fontSize: 9, color: '#1a1a1a', flex: 1 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', marginVertical: 12 },
  pageNumber: { position: 'absolute', bottom: 20, right: 40, fontSize: 8, color: '#9ca3af' },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#dbeafe' },
  headerOrg: { fontSize: 9, color: '#6b7280' },
})

const TIER_COLORS: Record<string, string> = {
  reach: '#fef2f2',
  match: '#fffbeb',
  safe: '#f0fdf4',
}
const TIER_TEXT: Record<string, string> = {
  reach: '#dc2626',
  match: '#d97706',
  safe: '#16a34a',
}
const TIER_LABELS: Record<string, string> = {
  reach: '冲刺',
  match: '匹配',
  safe: '保底',
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={[styles.bodyText, { flex: 1 }]}>{text}</Text>
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>
}

function PDFDocument({
  content,
  studentName,
  orgName,
  orgEmail,
  orgWechat,
  orgWhatsapp,
  isFree,
}: {
  content: StudyPlanContent
  studentName: string
  orgName: string
  orgEmail?: string
  orgWechat?: string
  orgWhatsapp?: string
  isFree: boolean
}) {
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        {isFree && <Text style={styles.watermark}>StudyAgent Copilot</Text>}
        <View style={styles.cover}>
          <Text style={styles.orgName}>{orgName}</Text>
          <Text style={styles.coverTitle}>{studentName} — 留学申请初步方案</Text>
          <Text style={styles.coverSub}>Study Abroad Preliminary Plan</Text>
          <Text style={styles.coverDate}>生成日期：{dateStr}</Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* Main Content Page */}
      <Page size="A4" style={styles.page} wrap>
        {isFree && <Text style={styles.watermark}>StudyAgent Copilot</Text>}
        <View style={styles.headerLine} fixed>
          <Text style={styles.headerOrg}>{orgName} — 留学申请方案</Text>
          <Text style={styles.headerOrg}>{studentName}</Text>
        </View>

        {/* Background Summary */}
        <View style={styles.section}>
          <SectionHeader title="一、学生背景摘要" />
          <Text style={styles.bodyText}>{content.background_summary}</Text>
        </View>

        {/* Application Target */}
        <View style={styles.section}>
          <SectionHeader title="二、申请定位" />
          <Text style={styles.bodyText}>{content.application_positioning}</Text>
          {content.recommended_countries?.length > 0 && (
            <>
              <Text style={[styles.bodyText, { marginTop: 6, fontFamily: 'Helvetica-Bold' }]}>目标国家：</Text>
              <View style={styles.tagRow}>
                {content.recommended_countries.map((c: string, i: number) => (
                  <Text key={i} style={styles.tag}>{c}</Text>
                ))}
              </View>
            </>
          )}
          {content.recommended_majors?.length > 0 && (
            <>
              <Text style={[styles.bodyText, { marginTop: 6, fontFamily: 'Helvetica-Bold' }]}>目标专业方向：</Text>
              <View style={styles.tagRow}>
                {content.recommended_majors.map((m: string, i: number) => (
                  <Text key={i} style={styles.tag}>{m}</Text>
                ))}
              </View>
            </>
          )}
        </View>

        {/* School Recommendations Table */}
        <View style={styles.section}>
          <SectionHeader title="三、推荐院校梯度" />
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colSchool, { color: 'white', fontSize: 9 }]}>学校 / 专业</Text>
            <Text style={[styles.colTier, { color: 'white', fontSize: 9 }]}>梯度</Text>
            <Text style={[styles.colFit, { color: 'white', fontSize: 9 }]}>匹配度</Text>
            <Text style={[styles.colReason, { color: 'white', fontSize: 9 }]}>推荐理由</Text>
          </View>
          {content.recommendations?.map((r: SchoolRecommendation, i: number) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
              <View style={styles.colSchool}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{r.school_name}</Text>
                <Text style={{ fontSize: 8, color: '#6b7280' }}>{r.program_name}</Text>
              </View>
              <View style={styles.colTier}>
                <Text style={[styles.tierBadge, { backgroundColor: TIER_COLORS[r.tier] || '#f9fafb', color: TIER_TEXT[r.tier] || '#374151' }]}>
                  {TIER_LABELS[r.tier] || r.tier}
                </Text>
              </View>
              <Text style={[styles.colFit, { color: '#1d4ed8', fontFamily: 'Helvetica-Bold' }]}>{r.fit_score}/10</Text>
              <Text style={styles.colReason}>{r.rationale}</Text>
            </View>
          ))}
        </View>

        {/* Strengths & Risks */}
        <View style={styles.section}>
          <SectionHeader title="四、优势与风险分析" />
          {content.strengths?.length > 0 && (
            <>
              <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold', color: '#16a34a' }]}>优势：</Text>
              {content.strengths.map((s: string, i: number) => <BulletItem key={i} text={s} />)}
            </>
          )}
          {content.weaknesses?.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold', color: '#dc2626' }]}>待提升项：</Text>
              {content.weaknesses.map((w: string, i: number) => <BulletItem key={i} text={w} />)}
            </View>
          )}
          {content.risk_summary && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>风险说明：</Text>
              <Text style={styles.bodyText}>{content.risk_summary}</Text>
            </View>
          )}
          {content.improvement_suggestions?.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>提升建议：</Text>
              {content.improvement_suggestions.map((s: string, i: number) => <BulletItem key={i} text={s} />)}
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <SectionHeader title="五、申请时间线" />
          <Text style={styles.bodyText}>{content.timeline_overview}</Text>
        </View>

        {/* Budget */}
        {content.budget_note && (
          <View style={styles.section}>
            <SectionHeader title="六、费用参考" />
            <Text style={styles.bodyText}>{content.budget_note}</Text>
          </View>
        )}

        {/* Next Steps */}
        {content.next_steps?.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="七、下一步行动" />
            {content.next_steps.map((s: string, i: number) => <BulletItem key={i} text={s} />)}
          </View>
        )}

        {/* Parent Section (if exists) */}
        {content.parent_section && (
          <View style={styles.section}>
            <SectionHeader title="八、家长参考版本" />
            {content.parent_section.country_comparison && (
              <>
                <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>国家选择分析：</Text>
                <Text style={styles.bodyText}>{content.parent_section.country_comparison}</Text>
              </>
            )}
            {content.parent_section.budget_breakdown && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>预算详解：</Text>
                <Text style={styles.bodyText}>{content.parent_section.budget_breakdown}</Text>
              </View>
            )}
            {content.parent_section.risks && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>风险与应对：</Text>
                <Text style={styles.bodyText}>{content.parent_section.risks}</Text>
              </View>
            )}
            {content.parent_section.parent_action_items && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.bodyText, { fontFamily: 'Helvetica-Bold' }]}>家长待办事项：</Text>
                <Text style={styles.bodyText}>{content.parent_section.parent_action_items}</Text>
              </View>
            )}
          </View>
        )}

        {/* Contact */}
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>顾问联系方式</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>机构：</Text>
            <Text style={styles.contactValue}>{orgName}</Text>
          </View>
          {orgEmail && (
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>邮箱：</Text>
              <Text style={styles.contactValue}>{orgEmail}</Text>
            </View>
          )}
          {orgWechat && (
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>微信：</Text>
              <Text style={styles.contactValue}>{orgWechat}</Text>
            </View>
          )}
          {orgWhatsapp && (
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>WhatsApp：</Text>
              <Text style={styles.contactValue}>{orgWhatsapp}</Text>
            </View>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{DISCLAIMER_ZH}</Text>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}

export async function POST(req: NextRequest) {
  try {
    const { planId, leadId, orgId } = await req.json()
    const supabase = await createClient()

    const [planRes, leadRes, orgRes] = await Promise.all([
      supabase.from('study_plans').select('*').eq('id', planId).single(),
      supabase.from('leads').select('student_name').eq('id', leadId).single(),
      supabase.from('organizations').select('name, contact_email, wechat, whatsapp, subscription_plan').eq('id', orgId).single(),
    ])

    if (!planRes.data) return NextResponse.json({ error: '方案不存在' }, { status: 404 })
    if (!planRes.data.is_approved) return NextResponse.json({ error: '方案未批准' }, { status: 403 })

    const plan = planRes.data
    const studentName = leadRes.data?.student_name || '学生'
    const org = orgRes.data as { name?: string; contact_email?: string; wechat?: string; whatsapp?: string; subscription_plan?: string } | null
    const isFree = !org?.subscription_plan || org.subscription_plan === 'free'

    const pdfBuffer = await renderToBuffer(
      <PDFDocument
        content={plan.content_json as StudyPlanContent}
        studentName={studentName}
        orgName={org?.name || 'StudyAgent Copilot'}
        orgEmail={org?.contact_email}
        orgWechat={org?.wechat}
        orgWhatsapp={org?.whatsapp}
        isFree={isFree}
      />
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(studentName)}_留学方案.pdf"`,
      },
    })
  } catch (e: any) {
    console.error('PDF export error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
