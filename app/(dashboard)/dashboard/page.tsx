'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, FileText, TrendingUp, CheckCircle,
  Plus, Clock, AlertCircle, Zap,
} from 'lucide-react'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    new_leads_this_month: 0,
    plans_generated: 0,
    high_intent_count: 0,
    signed_count: 0,
    pending_followup: 0,
    missing_materials: 0,
    upcoming_deadlines: 0,
    ai_usage_this_month: 0,
  })
  const [userName, setUserName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [plan, setPlan] = useState('free')
  const [usageLimit, setUsageLimit] = useState(3)
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, organization_id, onboarding_completed, organizations(*)')
      .eq('id', user.id)
      .single()

    if (!profile) { setLoading(false); return }

    if (!profile.onboarding_completed) {
      router.push('/onboarding')
      return
    }

    const org = (profile as any).organizations
    setUserName((profile as any).name || user.email || '')
    setOrgName(org?.name || '')
    setPlan(org?.subscription_plan || 'free')
    const limits: Record<string, number> = { free: 3, starter: 50, pro: 300, team: 1000 }
    setUsageLimit(limits[org?.subscription_plan || 'free'])

    const orgId = profile.organization_id
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [leadsRes, plansRes, usageRes, recentRes] = await Promise.all([
      supabase.from('leads').select('status, priority, last_followed_up_at').eq('organization_id', orgId),
      supabase.from('study_plans').select('id, created_at').gte('created_at', startOfMonth),
      supabase.from('usage_records').select('id').eq('organization_id', orgId).gte('created_at', startOfMonth),
      supabase.from('leads').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    ])

    const leads = leadsRes.data || []
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    setStats({
      new_leads_this_month: leads.filter(l => true).length,
      plans_generated: plansRes.data?.length || 0,
      high_intent_count: leads.filter(l => l.status === 'high_intent').length,
      signed_count: leads.filter(l => l.status === 'signed').length,
      pending_followup: leads.filter(l =>
        !['signed', 'lost', 'offer_received'].includes(l.status) &&
        (!l.last_followed_up_at || l.last_followed_up_at < threeDaysAgo)
      ).length,
      missing_materials: leads.filter(l => l.status === 'materials_in_progress').length,
      upcoming_deadlines: 0,
      ai_usage_this_month: usageRes.data?.length || 0,
    })

    setRecentLeads(recentRes.data || [])
    setLoading(false)
  }

  const statCards = [
    { label: '本月新增线索', value: stats.new_leads_this_month, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已生成方案', value: stats.plans_generated, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '高意向学生', value: stats.high_intent_count, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '已签约', value: stats.signed_count, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  const todayTodos = [
    stats.pending_followup > 0 && { icon: Clock, color: 'text-orange-500', text: `${stats.pending_followup} 位学生待跟进（超过 3 天未联系）`, action: () => router.push('/leads?filter=pending') },
    stats.missing_materials > 0 && { icon: AlertCircle, color: 'text-red-500', text: `${stats.missing_materials} 位学生材料准备中`, action: () => router.push('/leads?filter=materials') },
  ].filter(Boolean) as { icon: any; color: string; text: string; action: () => void }[]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            您好，{userName} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{orgName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-gray-500">
            <div>本月 AI 使用 {stats.ai_usage_this_month}/{usageLimit} 次</div>
            {plan === 'free' && stats.ai_usage_this_month >= usageLimit && (
              <Button size="sm" className="mt-1 h-6 text-xs" onClick={() => router.push('/billing')}>
                <Zap className="w-3 h-3 mr-1" />升级套餐
              </Button>
            )}
          </div>
          <Button onClick={() => router.push('/leads/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            新建学生方案
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">今日待办</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTodos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">今日暂无待办，继续保持！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTodos.map((todo, i) => (
                    <button
                      key={i}
                      onClick={todo.action}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <todo.icon className={`w-5 h-5 flex-shrink-0 ${todo.color}`} />
                      <span className="text-sm text-gray-700">{todo.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">最近线索</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/leads')}>
                  查看全部
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">暂无学生线索</p>
                  <Button size="sm" className="mt-3" onClick={() => router.push('/leads/new')}>
                    <Plus className="w-3 h-3 mr-1" />添加第一位学生
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLeads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {lead.student_name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{lead.student_name}</p>
                          <p className="text-xs text-gray-500">{lead.target_country?.join(', ')} · {lead.target_level || '未定'}</p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${lead.priority === 'high' ? 'bg-red-100 text-red-700' : lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {lead.priority === 'high' ? '高' : lead.priority === 'medium' ? '中' : '低'}优先
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: '新建学生方案', icon: Plus, action: () => router.push('/leads/new'), primary: true },
                { label: '查看线索看板', icon: Users, action: () => router.push('/leads') },
              ].map(({ label, icon: Icon, action, primary }) => (
                <Button
                  key={label}
                  onClick={action}
                  variant={primary ? 'default' : 'outline'}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-1">🎯 使用提示</h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                粘贴学生发来的咨询内容，AI 会自动提取背景信息，3 分钟内生成专业方案！
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
