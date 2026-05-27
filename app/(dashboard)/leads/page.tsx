'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Plus, Search, Users, Calendar, MessageCircle, Loader2,
} from 'lucide-react'
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '@/types'
import { LEAD_STATUS_LABELS, SOURCE_LABELS } from '@/types'

const SOURCES: LeadSource[] = ['xiaohongshu','wechat','whatsapp','website','referral','offline','instagram','facebook','other']
const LEVELS = [
  { value: 'master', label: '硕士' },
  { value: 'bachelor', label: '本科' },
  { value: 'phd', label: '博士' },
  { value: 'foundation', label: '预科' },
]
const COUNTRIES = ['UK','AU','SG','US','CA','HK','EU','MY','JP','NZ']

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [orgId, setOrgId] = useState('')

  const [form, setForm] = useState({
    student_name: '',
    contact: '',
    source: 'wechat' as LeadSource,
    priority: 'medium' as LeadPriority,
    target_country: [] as string[],
    target_level: 'master',
    target_major: '',
    budget_max: '',
    intake_year: new Date().getFullYear() + 1,
  })

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) { setLoading(false); return }
    setOrgId(profile.organization_id)

    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setLoading(false)
  }

  function toggleCountry(c: string) {
    setForm(f => ({
      ...f,
      target_country: f.target_country.includes(c)
        ? f.target_country.filter(x => x !== c)
        : [...f.target_country, c],
    }))
  }

  async function handleCreate() {
    if (!form.student_name.trim()) { toast.error('请填写学生姓名'); return }
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('leads').insert({
      organization_id: orgId,
      assigned_user_id: user.id,
      student_name: form.student_name,
      contact: form.contact,
      source: form.source,
      priority: form.priority,
      target_country: form.target_country,
      target_level: form.target_level,
      target_major: form.target_major,
      budget_max: form.budget_max ? parseInt(form.budget_max) : null,
      intake_year: form.intake_year,
      status: 'new',
    }).select().single()

    if (error) {
      toast.error('创建失败：' + error.message)
    } else {
      toast.success('线索已创建！')
      setSheetOpen(false)
      router.push(`/leads/${data.id}`)
    }
    setCreating(false)
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.student_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const priorityColor = (p: string) =>
    p === 'high' ? 'bg-red-100 text-red-700' : p === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '今天'
    if (diff === 1) return '昨天'
    if (diff < 7) return `${diff} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">学生线索</h2>
          <p className="text-sm text-gray-500 mt-0.5">共 {leads.length} 条线索</p>
        </div>
        <Button className="gap-2" onClick={() => setSheetOpen(true)}>
          <Plus className="w-4 h-4" />新建线索
        </Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[480px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>新建学生线索</SheetTitle>
              <SheetDescription>填写学生基本信息，创建后可进入详情页录入背景并生成方案</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>学生姓名 *</Label>
                <Input placeholder="例如：王小明" value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>联系方式</Label>
                <Input placeholder="微信号 / 手机号 / WhatsApp" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>来源渠道</Label>
                  <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as LeadSource }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map(s => (
                        <SelectItem key={s} value={s}>{SOURCE_LABELS[s].zh}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>优先级</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as LeadPriority }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>目标国家（可多选）</Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleCountry(c)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.target_country.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>申请阶段</Label>
                  <Select value={form.target_level} onValueChange={v => v && setForm(f => ({ ...f, target_level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>入学年份</Label>
                  <Select value={String(form.intake_year)} onValueChange={v => v && setForm(f => ({ ...f, intake_year: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2025, 2026, 2027, 2028].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>目标专业</Label>
                <Input placeholder="例如：金融硕士、计算机科学" value={form.target_major} onChange={e => setForm(f => ({ ...f, target_major: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>预算上限（人民币）</Label>
                <Input type="number" placeholder="例如：500000" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />创建中...</> : '创建线索'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="搜索学生姓名..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => v && setStatusFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.zh}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">{leads.length === 0 ? '暂无学生线索' : '没有匹配的结果'}</p>
          <p className="text-sm mt-1">{leads.length === 0 ? '点击「新建线索」添加第一位学生' : '尝试修改搜索或筛选条件'}</p>
          {leads.length === 0 && (
            <Button size="sm" className="mt-4" onClick={() => setSheetOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />新建线索
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(lead => {
            const statusInfo = LEAD_STATUS_LABELS[lead.status]
            return (
              <Card
                key={lead.id}
                className="hover:shadow-md transition-all cursor-pointer border hover:border-indigo-200"
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {lead.student_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{lead.student_name}</span>
                          <Badge variant="secondary" className={`text-xs ${priorityColor(lead.priority)}`}>
                            {lead.priority === 'high' ? '高' : lead.priority === 'medium' ? '中' : '低'}优先
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span>{lead.target_country?.join(', ') || '目标未定'}</span>
                          {lead.target_level && <span>· {lead.target_level === 'master' ? '硕士' : lead.target_level === 'bachelor' ? '本科' : lead.target_level}</span>}
                          {lead.target_major && <span>· {lead.target_major}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <Badge className={`text-xs ${statusInfo?.color || 'bg-gray-100 text-gray-600'}`}>
                        {statusInfo?.zh || lead.status}
                      </Badge>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(lead.last_followed_up_at || lead.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
