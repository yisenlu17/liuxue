'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Loader2, Sparkles, FileText, CheckCircle, AlertTriangle,
  Copy, Download, Brain, MessageCircle, ClipboardList, Pencil,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import StageBackgroundForm from '@/components/leads/StageBackgroundForm'
import type { Lead, StudentProfile, StudyPlan, Material, FollowUp, FollowUpChannel, FollowUpType, FollowUpTone, LeadSource, LeadPriority, ExtraData } from '@/types'
import { LEAD_STATUS_LABELS } from '@/types'

const COUNTRIES = ['UK', 'AU', 'US', 'CA', 'SG', 'NZ', 'IE', 'NL', 'DE', 'JP', 'HK']
const LEVELS = [
  { value: 'high_school', label: '高中' },
  { value: 'foundation', label: '预科' },
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
  { value: 'language', label: '语言课程' },
]
const SOURCES = [
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'wechat', label: '微信' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: '官网' },
  { value: 'referral', label: '朋友介绍' },
  { value: 'offline', label: '线下活动' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: '其他' },
]

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [profile, setProfile] = useState<Partial<StudentProfile>>({})
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [followups, setFollowups] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState('')
  const [aiProvider, setAiProvider] = useState<'claude' | 'openai'>('claude')

  const [rawInput, setRawInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [savingBackground, setSavingBackground] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [generatingFollowup, setGeneratingFollowup] = useState(false)
  const [generatingMaterials, setGeneratingMaterials] = useState(false)

  const [followupChannel, setFollowupChannel] = useState<FollowUpChannel>('wechat')
  const [followupType, setFollowupType] = useState<FollowUpType>('post_plan_1d')
  const [followupTone, setFollowupTone] = useState<FollowUpTone>('warm')

  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(3)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Lead>>({})
  const [savingLead, setSavingLead] = useState(false)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [leadRes, profileRes, plansRes, materialsRes, followupsRes, profileDBRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase.from('student_profiles').select('*').eq('lead_id', id).single(),
      supabase.from('study_plans').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      supabase.from('materials').select('*').eq('lead_id', id),
      supabase.from('follow_ups').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('organization_id, organizations(ai_provider, subscription_plan)').eq('id', user.id).single(),
    ])

    if (leadRes.data) setLead(leadRes.data)
    if (profileRes.data) { setProfile(profileRes.data); setRawInput(profileRes.data.raw_input || '') }
    if (plansRes.data) { setPlans(plansRes.data); if (plansRes.data.length > 0) setActivePlan(plansRes.data[0]) }
    if (materialsRes.data) setMaterials(materialsRes.data)
    if (followupsRes.data) setFollowups(followupsRes.data)
    if (profileDBRes.data) {
      const org = (profileDBRes.data as any).organizations
      setOrgId(profileDBRes.data.organization_id)
      setAiProvider(org?.ai_provider || 'claude')
      const limits: Record<string, number> = { free: 3, starter: 50, pro: 300, team: 1000 }
      setUsageLimit(limits[org?.subscription_plan || 'free'])

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase.from('usage_records').select('id', { count: 'exact', head: true })
        .eq('organization_id', profileDBRes.data.organization_id)
        .gte('created_at', startOfMonth)
      setUsageCount(count || 0)
    }
    setLoading(false)
  }

  async function handleExtractBackground() {
    if (!rawInput.trim()) { toast.error('请先粘贴学生咨询内容'); return }
    setExtracting(true)
    try {
      const res = await fetch('/api/ai/extract-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawInput, provider: aiProvider }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile(prev => ({ ...prev, ...data.extracted, raw_input: rawInput }))
      if (lead && data.extracted.target_country?.length) {
        setLead(prev => prev ? { ...prev, target_country: data.extracted.target_country } : prev)
      }
      toast.success('信息提取成功！请检查并补充后保存')
    } catch (e: any) {
      toast.error('提取失败：' + e.message)
    }
    setExtracting(false)
  }

  async function handleSaveBackground() {
    setSavingBackground(true)
    const supabase = createClient()
    await supabase.from('student_profiles').upsert({
      lead_id: id,
      ...profile,
      raw_input: rawInput,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'lead_id' })

    await supabase.from('leads').update({ status: 'background_collected' }).eq('id', id)
    setLead(prev => prev ? { ...prev, status: 'background_collected' } : prev)
    toast.success('背景信息已保存')
    setSavingBackground(false)
  }

  async function checkUsage(): Promise<boolean> {
    if (usageCount >= usageLimit) {
      toast.error(`免费额度已用完（${usageCount}/${usageLimit}），请升级套餐继续使用`, {
        action: { label: '升级', onClick: () => router.push('/billing') },
      })
      return false
    }
    return true
  }

  async function handleGeneratePlan(planType: 'student' | 'parent') {
    if (!await checkUsage()) return
    if (!lead) return
    setGeneratingPlan(true)
    try {
      const res = await fetch(`/api/ai/${planType === 'student' ? 'generate-plan' : 'generate-parent'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, provider: aiProvider, planType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: newPlan } = await supabase.from('study_plans').insert({
        lead_id: id,
        created_by: user?.id,
        plan_type: planType,
        language: 'zh',
        content_json: data.content,
        risk_flags: data.riskFlags || [],
        is_approved: false,
      }).select().single()

      if (newPlan) {
        setPlans(prev => [newPlan as StudyPlan, ...prev])
        setActivePlan(newPlan as StudyPlan)
      }

      await supabase.from('usage_records').insert({
        organization_id: orgId,
        user_id: user?.id,
        action_type: `generate_${planType}_plan`,
        model: aiProvider === 'claude' ? 'claude-sonnet-4-6' : 'gpt-4o',
      })
      setUsageCount(c => c + 1)

      await supabase.from('leads').update({ status: 'plan_generated' }).eq('id', id)
      setLead(prev => prev ? { ...prev, status: 'plan_generated' } : prev)

      if (data.riskFlags?.length > 0) {
        toast.warning(`方案生成成功，但包含 ${data.riskFlags.length} 项风险提示，请检查后再发送`)
      } else {
        toast.success('方案生成成功！')
      }
    } catch (e: any) {
      toast.error('生成失败：' + e.message)
    }
    setGeneratingPlan(false)
  }

  async function handleApprovePlan(planId: string) {
    const supabase = createClient()
    await supabase.from('study_plans').update({ is_approved: true }).eq('id', planId)
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, is_approved: true } : p))
    if (activePlan?.id === planId) setActivePlan(prev => prev ? { ...prev, is_approved: true } : prev)
    toast.success('方案已批准！可以导出 PDF 了')
  }

  async function handleExportPDF(plan: StudyPlan) {
    if (!plan.is_approved) { toast.error('请先批准方案再导出'); return }
    const res = await fetch('/api/pdf/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id, leadId: id, orgId }),
    })
    if (!res.ok) { toast.error('导出失败'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lead?.student_name || 'plan'}_留学方案.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('PDF 已下载')
  }

  async function handleGenerateFollowup() {
    if (!await checkUsage()) return
    setGeneratingFollowup(true)
    try {
      const res = await fetch('/api/ai/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          studentName: lead?.student_name,
          channel: followupChannel,
          messageType: followupType,
          tone: followupTone,
          provider: aiProvider,
          planSummary: activePlan ? activePlan.content_json.background_summary : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newFollowup } = await supabase.from('follow_ups').insert({
        lead_id: id,
        channel: followupChannel,
        message_type: followupType,
        message_content: data.message,
        tone: followupTone,
        language: 'zh',
      }).select().single()

      if (newFollowup) setFollowups(prev => [newFollowup as FollowUp, ...prev])
      await supabase.from('usage_records').insert({
        organization_id: orgId,
        user_id: user?.id,
        action_type: 'generate_followup',
        model: aiProvider === 'claude' ? 'claude-haiku-4-5-20251001' : 'gpt-4o-mini',
      })
      setUsageCount(c => c + 1)
      toast.success('话术生成成功！')
    } catch (e: any) {
      toast.error('生成失败：' + e.message)
    }
    setGeneratingFollowup(false)
  }

  async function handleGenerateMaterials() {
    if (!lead) return
    setGeneratingMaterials(true)
    try {
      const res = await fetch('/api/ai/generate-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          targetCountry: lead.target_country,
          targetLevel: lead.target_level,
          targetMajor: lead.target_major,
          provider: aiProvider,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      await supabase.from('materials').delete().eq('lead_id', id)
      const items = data.materials.map((m: any) => ({ lead_id: id, material_name: m.material_name, notes: m.notes, status: 'pending' }))
      const { data: newMats } = await supabase.from('materials').insert(items).select()
      if (newMats) setMaterials(newMats as Material[])
      toast.success('材料清单已生成')
    } catch (e: any) {
      toast.error('生成失败：' + e.message)
    }
    setGeneratingMaterials(false)
  }

  async function updateMaterialStatus(matId: string, status: string) {
    const supabase = createClient()
    await supabase.from('materials').update({ status }).eq('id', matId)
    setMaterials(prev => prev.map(m => m.id === matId ? { ...m, status: status as any } : m))
  }

  async function updateLeadStatus(status: string) {
    const supabase = createClient()
    await supabase.from('leads').update({ status }).eq('id', id)
    setLead(prev => prev ? { ...prev, status: status as any } : prev)
    toast.success('状态已更新')
  }

  function openEdit() {
    if (!lead) return
    setEditForm({
      student_name: lead.student_name,
      contact: lead.contact,
      source: lead.source,
      priority: lead.priority,
      target_country: lead.target_country || [],
      target_level: lead.target_level,
      target_major: lead.target_major,
      budget_min: lead.budget_min,
      budget_max: lead.budget_max,
      intake_year: lead.intake_year,
    })
    setEditOpen(true)
  }

  function toggleEditCountry(c: string) {
    setEditForm(prev => {
      const current = prev.target_country || []
      return {
        ...prev,
        target_country: current.includes(c) ? current.filter(x => x !== c) : [...current, c],
      }
    })
  }

  async function handleSaveLead() {
    if (!editForm.student_name?.trim()) { toast.error('姓名不能为空'); return }
    setSavingLead(true)
    const supabase = createClient()
    const { error } = await supabase.from('leads').update({
      student_name: editForm.student_name,
      contact: editForm.contact,
      source: editForm.source,
      priority: editForm.priority,
      target_country: editForm.target_country,
      target_level: editForm.target_level,
      target_major: editForm.target_major,
      budget_min: editForm.budget_min || null,
      budget_max: editForm.budget_max || null,
      intake_year: editForm.intake_year || null,
    }).eq('id', id)
    if (error) {
      toast.error('保存失败：' + error.message)
    } else {
      setLead(prev => prev ? { ...prev, ...editForm } as Lead : prev)
      setEditOpen(false)
      toast.success('基本信息已更新')
    }
    setSavingLead(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  )

  if (!lead) return (
    <div className="text-center py-16 text-gray-400">
      <p>学生不存在</p>
      <Button variant="link" onClick={() => router.push('/leads')}>返回线索列表</Button>
    </div>
  )

  const statusInfo = LEAD_STATUS_LABELS[lead.status]
  const materialStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '未开始', color: 'bg-gray-100 text-gray-600' },
    reminded: { label: '已提醒', color: 'bg-yellow-100 text-yellow-700' },
    in_progress: { label: '准备中', color: 'bg-blue-100 text-blue-700' },
    received: { label: '已收到', color: 'bg-green-100 text-green-700' },
    needs_revision: { label: '需修改', color: 'bg-orange-100 text-orange-700' },
    done: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  }

  return (
    <div className="space-y-5">
      {/* Edit Lead Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑学生基本信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>学生姓名 *</Label>
                <Input value={editForm.student_name || ''} onChange={e => setEditForm(p => ({ ...p, student_name: e.target.value }))} placeholder="王小明" />
              </div>
              <div className="space-y-1.5">
                <Label>联系方式</Label>
                <Input value={editForm.contact || ''} onChange={e => setEditForm(p => ({ ...p, contact: e.target.value }))} placeholder="微信 / 手机 / WhatsApp" />
              </div>
              <div className="space-y-1.5">
                <Label>来源渠道</Label>
                <Select value={editForm.source || 'other'} onValueChange={v => v && setEditForm(p => ({ ...p, source: v as LeadSource }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>优先级</Label>
                <Select value={editForm.priority || 'medium'} onValueChange={v => v && setEditForm(p => ({ ...p, priority: v as LeadPriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>申请阶段</Label>
                <Select value={editForm.target_level || ''} onValueChange={v => v && setEditForm(p => ({ ...p, target_level: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择阶段" /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>目标国家（可多选）</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COUNTRIES.map(c => (
                  <button key={c} type="button" onClick={() => toggleEditCountry(c)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                      (editForm.target_country || []).includes(c)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>目标专业</Label>
              <Input value={editForm.target_major || ''} onChange={e => setEditForm(p => ({ ...p, target_major: e.target.value }))} placeholder="金融硕士、计算机科学..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>预算下限（万）</Label>
                <Input type="number" value={editForm.budget_min || ''} onChange={e => setEditForm(p => ({ ...p, budget_min: parseInt(e.target.value) || undefined }))} placeholder="20" />
              </div>
              <div className="space-y-1.5">
                <Label>预算上限（万）</Label>
                <Input type="number" value={editForm.budget_max || ''} onChange={e => setEditForm(p => ({ ...p, budget_max: parseInt(e.target.value) || undefined }))} placeholder="50" />
              </div>
              <div className="space-y-1.5">
                <Label>入学年份</Label>
                <Select value={String(editForm.intake_year || new Date().getFullYear() + 1)} onValueChange={v => v && setEditForm(p => ({ ...p, intake_year: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027, 2028].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
            <Button onClick={handleSaveLead} disabled={savingLead}>
              {savingLead && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/leads')} className="gap-1">
          <ArrowLeft className="w-4 h-4" />返回
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
            {lead.student_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{lead.student_name}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{lead.target_country?.join(', ')}</span>
              {lead.target_level && <span>· {lead.target_level}</span>}
              {lead.target_major && <span>· {lead.target_major}</span>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={openEdit} className="gap-1 text-gray-400 hover:text-gray-700">
            <Pencil className="w-3.5 h-3.5" />编辑
          </Button>
        </div>
        <Select value={lead.status} onValueChange={v => v && updateLeadStatus(v)}>
          <SelectTrigger className="w-40">
            <Badge className={`text-xs ${statusInfo?.color}`}>{statusInfo?.zh}</Badge>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.zh}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-gray-400">
          AI 用量：{usageCount}/{usageLimit}
        </div>
      </div>

      <Tabs defaultValue="background" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="background">📋 背景</TabsTrigger>
          <TabsTrigger value="plans">🎯 方案</TabsTrigger>
          <TabsTrigger value="materials">📁 材料</TabsTrigger>
          <TabsTrigger value="followups">💬 话术</TabsTrigger>
        </TabsList>

        {/* Background Tab */}
        <TabsContent value="background" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">粘贴学生原话（AI 自动提取）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="直接粘贴学生发来的咨询内容，例如：我现在在 NUS 读商科，GPA 3.4，雅思 7，想申请英国或者香港的金融硕士，预算 50 万人民币以内..."
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button onClick={handleExtractBackground} disabled={extracting} variant="outline" size="sm" className="gap-2">
                {extracting ? <><Loader2 className="w-3 h-3 animate-spin" />提取中...</> : <><Sparkles className="w-3 h-3" />AI 提取信息</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">结构化背景信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {lead.target_level === 'high_school' || lead.target_level === 'foundation' ? '就读高中名称' : '就读大学名称'}
                  </Label>
                  <Input
                    placeholder={lead.target_level === 'high_school' || lead.target_level === 'foundation' ? '如：北京四中国际部' : '如：NUS、北京大学'}
                    value={profile.current_school || ''}
                    onChange={e => setProfile(prev => ({ ...prev, current_school: e.target.value }))}
                  />
                </div>
                {lead.target_level !== 'high_school' && lead.target_level !== 'foundation' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">本科 / 研究生专业</Label>
                    <Input placeholder="如：经济学、计算机科学" value={profile.current_major || ''} onChange={e => setProfile(prev => ({ ...prev, current_major: e.target.value }))} />
                  </div>
                )}
                {/* Academic performance — adapts to target level + exam board */}
                {(() => {
                  const isHS = lead.target_level === 'high_school' || lead.target_level === 'foundation'
                  const ed = (profile.extra_data as ExtraData) || {}
                  const eb = ed.exam_board
                  const setED = (ch: Partial<ExtraData>) => setProfile(prev => ({
                    ...prev, extra_data: { ...(prev.extra_data as ExtraData || {}), ...ch } as ExtraData,
                  }))

                  if (!isHS) return (
                    <div className="space-y-1.5">
                      <Label className="text-xs">GPA / 均分</Label>
                      <div className="flex gap-2">
                        <Input type="number" step="0.01" placeholder="3.5" value={profile.gpa || ''} onChange={e => setProfile(prev => ({ ...prev, gpa: parseFloat(e.target.value) }))} className="w-24" />
                        <Select value={String(profile.gpa_scale || 4)} onValueChange={v => v && setProfile(prev => ({ ...prev, gpa_scale: parseFloat(v) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">满分 4.0</SelectItem>
                            <SelectItem value="5">满分 5.0</SelectItem>
                            <SelectItem value="100">百分制 100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )

                  if (!eb) return (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400">学术成绩概要</Label>
                      <div className="h-9 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center px-3">
                        <span className="text-xs text-gray-400">请先在下方选择考试制度</span>
                      </div>
                    </div>
                  )

                  if (eb === 'IB') return (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">IB 预测总分</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} max={45} value={ed.ib_predicted_total ?? ''} onChange={e => setED({ ib_predicted_total: +e.target.value || undefined })} placeholder="38" className="w-20" />
                        <span className="text-sm text-gray-400">/ 45 分</span>
                      </div>
                    </div>
                  )

                  if (eb === 'A-Level') return (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">A-Level 综合成绩（A* → F）</Label>
                      <div className="flex gap-2">
                        <Input value={ed.alevel_overall_predicted || ''} onChange={e => setED({ alevel_overall_predicted: e.target.value || undefined })} placeholder="预测：A*AA" className="w-32 font-mono" />
                        <Input value={ed.alevel_overall_actual || ''} onChange={e => setED({ alevel_overall_actual: e.target.value || undefined })} placeholder="实际：AAB" className="w-32 font-mono" />
                      </div>
                      <p className="text-xs text-gray-400">各科等级从高到低组合，如 A*AA、A*A*B</p>
                    </div>
                  )

                  if (eb === 'AP') return (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">AP 修读情况（满分 5 分）</Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">共修</span>
                        <Input type="number" min={0} value={ed.ap_total_count ?? ''} onChange={e => setED({ ap_total_count: +e.target.value || undefined })} placeholder="5" className="w-14 h-8 text-xs" />
                        <span className="text-xs text-gray-500">门，其中</span>
                        <Input type="number" min={0} value={ed.ap_five_count ?? ''} onChange={e => setED({ ap_five_count: +e.target.value || undefined })} placeholder="3" className="w-14 h-8 text-xs" />
                        <span className="text-xs text-gray-500">门 5 分</span>
                      </div>
                    </div>
                  )

                  if (eb === 'gaokao') return (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">高考总分</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={ed.gaokao_total ?? ''} onChange={e => setED({ gaokao_total: +e.target.value || undefined })} placeholder="650" className="w-28" />
                        <span className="text-sm text-gray-400">/ {ed.gaokao_full_mark || 750} 分</span>
                      </div>
                    </div>
                  )

                  if (eb === 'IGCSE') return (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">IGCSE 顶级成绩科目数（A* → F）</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} value={ed.igcse_top_count ?? ''} onChange={e => setED({ igcse_top_count: +e.target.value || undefined })} placeholder="8" className="w-20" />
                        <span className="text-xs text-gray-400">科达到 A* 或 A</span>
                      </div>
                    </div>
                  )

                  return null
                })()}
                <div className="space-y-1.5">
                  <Label className="text-xs">语言成绩（英语）</Label>
                  <div className="flex gap-2">
                    <Select value={profile.language_type || 'ielts'} onValueChange={v => setProfile(prev => ({ ...prev, language_type: v as any }))}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ielts">雅思</SelectItem>
                        <SelectItem value="toefl">托福</SelectItem>
                        <SelectItem value="duolingo">多邻国</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" step="0.5" placeholder="7.0" value={profile.language_score || ''} onChange={e => setProfile(prev => ({ ...prev, language_score: parseFloat(e.target.value) }))} />
                  </div>
                </div>
                {lead.target_level !== 'high_school' && lead.target_level !== 'foundation' && (
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">工作 / 实习经历（概述）</Label>
                    <Textarea placeholder="公司名、职位、时长..." value={profile.work_experience || ''} onChange={e => setProfile(prev => ({ ...prev, work_experience: e.target.value }))} rows={2} className="resize-none" />
                  </div>
                )}
                {lead.target_level !== 'high_school' && lead.target_level !== 'foundation' && (
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">科研经历（概述）</Label>
                    <Textarea placeholder="参与的科研项目..." value={profile.research_experience || ''} onChange={e => setProfile(prev => ({ ...prev, research_experience: e.target.value }))} rows={2} className="resize-none" />
                  </div>
                )}
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">课外活动 / 社团 / 志愿者</Label>
                  <Textarea placeholder="竞赛、志愿者、社团、体育..." value={profile.extracurriculars || ''} onChange={e => setProfile(prev => ({ ...prev, extracurriculars: e.target.value }))} rows={2} className="resize-none" />
                </div>
              </div>

              {/* Stage-specific form */}
              {lead.target_level && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {{
                      high_school: '🎓 高中阶段详细成绩',
                      foundation: '🎓 高中 / 预科阶段详细成绩',
                      bachelor: '🏛 本科阶段详细信息',
                      master: '🏛 研究生阶段详细信息',
                      phd: '🔬 博士申请详细信息',
                      language: '📚 语言课程背景',
                    }[lead.target_level] || '阶段详细信息'}
                  </p>
                  <StageBackgroundForm
                    targetLevel={lead.target_level}
                    extraData={(profile.extra_data as ExtraData) || {}}
                    onChange={(changes) => setProfile(prev => ({
                      ...prev,
                      extra_data: { ...(prev.extra_data as ExtraData || {}), ...changes } as ExtraData,
                    }))}
                  />
                </div>
              )}

              <Button className="gap-2" onClick={handleSaveBackground} disabled={savingBackground}>
                {savingBackground ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : '保存背景信息'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={() => handleGeneratePlan('student')} disabled={generatingPlan} className="gap-2">
              {generatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              生成学生版方案
            </Button>
            <Button onClick={() => handleGeneratePlan('parent')} disabled={generatingPlan} variant="outline" className="gap-2">
              {generatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              生成家长版
            </Button>
          </div>

          {generatingPlan && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-5 text-center">
                <Brain className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-pulse" />
                <p className="font-medium text-indigo-800">AI 正在生成方案...</p>
                <p className="text-sm text-indigo-600 mt-1">通常需要 30-60 秒，请稍候</p>
              </CardContent>
            </Card>
          )}

          {plans.length === 0 && !generatingPlan ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">暂无方案</p>
              <p className="text-sm mt-1">请先完善学生背景，再点击「生成方案」</p>
            </div>
          ) : activePlan && (
            <div className="space-y-4">
              {plans.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {plans.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setActivePlan(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${activePlan.id === p.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                    >
                      {p.plan_type === 'parent' ? '家长版' : '学生版'} v{p.version}
                      {p.is_approved && <CheckCircle className="inline w-3 h-3 ml-1 text-green-400" />}
                    </button>
                  ))}
                </div>
              )}

              {activePlan.risk_flags.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">风险提示：方案包含以下问题，请修改后再发送</p>
                    <ul className="mt-1 space-y-0.5">
                      {activePlan.risk_flags.map((flag, i) => (
                        <li key={i} className="text-xs text-red-600">· {flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <Card>
                <CardContent className="p-5 space-y-5">
                  {activePlan.plan_type === 'student' ? (
                    <StudentPlanView plan={activePlan} />
                  ) : (
                    <ParentPlanView plan={activePlan} />
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                {!activePlan.is_approved ? (
                  <Button onClick={() => handleApprovePlan(activePlan.id)} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    批准方案
                  </Button>
                ) : (
                  <Badge className="bg-green-100 text-green-700 gap-1 px-3 py-1.5">
                    <CheckCircle className="w-3 h-3" />已批准
                  </Badge>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleExportPDF(activePlan)}
                  disabled={!activePlan.is_approved}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出 PDF
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleGenerateMaterials} disabled={generatingMaterials} variant="outline" className="gap-2">
              {generatingMaterials ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              AI 生成材料清单
            </Button>
          </div>
          {materials.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">暂无材料清单，点击「AI 生成材料清单」自动生成</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {materials.map(mat => (
                    <div key={mat.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{mat.material_name}</p>
                        {mat.notes && <p className="text-xs text-gray-500 mt-0.5">{mat.notes}</p>}
                      </div>
                      <Select value={mat.status} onValueChange={v => v && updateMaterialStatus(mat.id, v)}>
                        <SelectTrigger className="w-28">
                          <Badge className={`text-xs ${materialStatusMap[mat.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {materialStatusMap[mat.status]?.label || mat.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(materialStatusMap).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">生成跟进话术</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">发送渠道</Label>
                  <Select value={followupChannel} onValueChange={v => setFollowupChannel(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wechat">微信</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">话术类型</Label>
                  <Select value={followupType} onValueChange={v => setFollowupType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">初次回复</SelectItem>
                      <SelectItem value="post_plan_1d">发方案后 1 天</SelectItem>
                      <SelectItem value="post_plan_3d">发方案后 3 天</SelectItem>
                      <SelectItem value="post_plan_7d">发方案后 7 天</SelectItem>
                      <SelectItem value="parent_communication">家长沟通</SelectItem>
                      <SelectItem value="urge_materials">催材料</SelectItem>
                      <SelectItem value="push_sign">催签约</SelectItem>
                      <SelectItem value="price_objection">价格异议</SelectItem>
                      <SelectItem value="hesitation">学生犹豫</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">语气风格</Label>
                  <Select value={followupTone} onValueChange={v => setFollowupTone(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warm">温和亲切</SelectItem>
                      <SelectItem value="professional">专业正式</SelectItem>
                      <SelectItem value="sales">强推动</SelectItem>
                      <SelectItem value="parent_friendly">家长友好</SelectItem>
                      <SelectItem value="concise">简洁直接</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateFollowup} disabled={generatingFollowup} className="gap-2">
                {generatingFollowup ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                生成话术
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {followups.map(fu => (
              <Card key={fu.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{fu.channel}</Badge>
                      <Badge variant="outline" className="text-xs">{fu.message_type}</Badge>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(fu.message_content); toast.success('已复制！') }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Copy className="w-3 h-3" />复制
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{fu.message_content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StudentPlanView({ plan }: { plan: StudyPlan }) {
  const c = plan.content_json
  const tierColor = { reach: 'bg-red-100 text-red-700', match: 'bg-blue-100 text-blue-700', safe: 'bg-green-100 text-green-700' }
  const tierLabel = { reach: '冲刺', match: '匹配', safe: '保底' }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-semibold text-gray-900 mb-1">📋 背景摘要</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{c.background_summary}</p>
      </section>
      <section>
        <h3 className="font-semibold text-gray-900 mb-1">🎯 申请定位</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{c.application_positioning}</p>
      </section>
      <section>
        <h3 className="font-semibold text-gray-900 mb-3">🏫 院校梯度推荐</h3>
        <div className="space-y-3">
          {c.recommendations?.map((rec, i) => (
            <div key={i} className="border rounded-lg p-4 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{rec.school_name}</span>
                    <Badge className={`text-xs ${tierColor[rec.tier as keyof typeof tierColor]}`}>
                      {tierLabel[rec.tier as keyof typeof tierLabel]}
                    </Badge>
                    <span className="text-xs text-gray-400">{rec.country}</span>
                    {rec.is_primary && <Badge className="text-xs bg-indigo-100 text-indigo-700">主申</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{rec.program_name}</p>
                  <p className="text-sm text-gray-600 mt-2">{rec.rationale}</p>
                  {rec.risks && (
                    <p className="text-xs text-orange-600 mt-1.5 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {rec.risks}
                    </p>
                  )}
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-xl font-bold text-indigo-600">{rec.fit_score}</div>
                  <div className="text-xs text-gray-400">适配度</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4">
        <section>
          <h3 className="font-semibold text-gray-900 mb-2">✅ 申请优势</h3>
          <ul className="space-y-1">
            {c.strengths?.map((s, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-green-500">·</span>{s}</li>)}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-gray-900 mb-2">⚠️ 申请短板</h3>
          <ul className="space-y-1">
            {c.weaknesses?.map((w, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-orange-500">·</span>{w}</li>)}
          </ul>
        </section>
      </div>
      <section>
        <h3 className="font-semibold text-gray-900 mb-1">🚨 风险提示</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{c.risk_summary}</p>
      </section>
      <section>
        <h3 className="font-semibold text-gray-900 mb-1">📅 时间线建议</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{c.timeline_overview}</p>
      </section>
      <section>
        <h3 className="font-semibold text-gray-900 mb-2">⚡ 下一步行动</h3>
        <ul className="space-y-1">
          {c.next_steps?.map((s, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="font-medium text-indigo-600">{i + 1}.</span>{s}</li>)}
        </ul>
      </section>
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-400 leading-relaxed">{c.disclaimer}</p>
      </div>
    </div>
  )
}

function ParentPlanView({ plan }: { plan: StudyPlan }) {
  const c = plan.content_json
  const ps = c.parent_section
  if (!ps) return <p className="text-gray-500 text-sm">家长版内容加载中...</p>

  const sections = [
    { title: '🌏 国家/地区对比', content: ps.country_comparison },
    { title: '🎓 为什么推荐这些学校', content: ps.why_these_schools },
    { title: '💰 预算大致拆解', content: ps.budget_breakdown },
    { title: '📅 时间规划', content: ps.timeline },
    { title: '⚠️ 主要风险', content: ps.risks },
    { title: '✨ 如何提升成功率', content: ps.success_tips },
    { title: '👨‍👩‍👦 家长需要配合的事项', content: ps.parent_action_items },
  ]

  return (
    <div className="space-y-5">
      {sections.map(({ title, content }) => content && (
        <section key={title}>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{content}</p>
        </section>
      ))}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-400 leading-relaxed">{c.disclaimer}</p>
      </div>
    </div>
  )
}
