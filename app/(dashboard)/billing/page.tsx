'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, Zap, Building, Users, Crown } from 'lucide-react'
import type { SubscriptionPlan } from '@/types'
import { PLAN_LIMITS } from '@/types'

const PLANS: {
  id: SubscriptionPlan
  name: string
  price: string
  period: string
  icon: React.ReactNode
  features: string[]
  highlight: boolean
}[] = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    period: '永久',
    icon: <Zap className="h-5 w-5 text-gray-500" />,
    features: [
      `每月 ${PLAN_LIMITS.free} 次 AI 生成`,
      '基础方案生成（学生版）',
      '线索管理（无限）',
      'PDF 导出（含水印）',
      '社区支持',
    ],
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '¥299',
    period: '每月',
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    features: [
      `每月 ${PLAN_LIMITS.starter} 次 AI 生成`,
      '学生版 + 家长版方案',
      '跟进话术生成',
      'PDF 自定义品牌（无水印）',
      '邮件支持',
    ],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '¥799',
    period: '每月',
    icon: <Crown className="h-5 w-5 text-yellow-500" />,
    features: [
      `每月 ${PLAN_LIMITS.pro} 次 AI 生成`,
      '全部方案类型',
      '优先级高的模型（claude-sonnet）',
      'PDF 自定义品牌 + Logo',
      '数据导出（Excel）',
      '优先邮件支持',
    ],
    highlight: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '¥1,999',
    period: '每月',
    icon: <Users className="h-5 w-5 text-purple-500" />,
    features: [
      `每月 ${PLAN_LIMITS.team} 次 AI 生成`,
      '多顾问账号（最多 10 人）',
      '团队权限管理',
      '全部 Pro 功能',
      '专属客服 + 培训',
      'API 集成支持',
    ],
    highlight: false,
  },
]

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free')
  const [usageCount, setUsageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState('')

  useEffect(() => { loadBilling() }, [])

  async function loadBilling() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, organizations(subscription_plan)')
      .eq('id', user.id)
      .single()

    if (profile) {
      setOrgId(profile.organization_id)
      const org = (profile as any).organizations
      setCurrentPlan(org?.subscription_plan || 'free')

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase
        .from('usage_records')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startOfMonth)
      setUsageCount(count || 0)
    }
    setLoading(false)
  }

  const limit = PLAN_LIMITS[currentPlan]
  const usagePct = Math.min(100, Math.round((usageCount / limit) * 100))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">订阅与用量</h1>
        <p className="text-muted-foreground text-sm mt-1">管理你的套餐和 AI 使用配额</p>
      </div>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>本月 AI 用量</CardTitle>
          <CardDescription>
            当前套餐：
            <Badge variant="outline" className="ml-1 capitalize">{currentPlan}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已使用</span>
              <span className="font-medium">{usageCount} / {limit} 次</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-yellow-500' : 'bg-blue-600'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usagePct >= 80 && (
              <p className="text-xs text-amber-600">
                {usagePct >= 100 ? '用量已达上限，请升级套餐继续使用' : `用量即将达到上限（${usagePct}%），建议提前升级`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">选择套餐</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isActive = plan.id === currentPlan
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${plan.highlight ? 'border-blue-500 shadow-md shadow-blue-100' : ''} ${isActive ? 'ring-2 ring-blue-600' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white text-xs px-3">最受欢迎</Badge>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3 right-3">
                    <Badge variant="secondary" className="text-xs">当前套餐</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    {plan.icon}
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isActive ? 'outline' : plan.highlight ? 'default' : 'outline'}
                    className="w-full"
                    disabled={isActive || plan.id === 'free'}
                    onClick={() => {
                      if (!isActive && plan.id !== 'free') {
                        window.alert(`如需升级到 ${plan.name}，请联系我们：support@studyagent.ai\n\n（正式版将集成在线支付）`)
                      }
                    }}
                  >
                    {isActive ? '当前套餐' : plan.id === 'free' ? '免费使用' : `升级到 ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Contact */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">企业定制方案</p>
              <p className="text-sm text-muted-foreground mt-1">
                需要更多座席、私有化部署或 API 集成？联系我们获取企业报价方案。
              </p>
              <p className="text-sm text-blue-600 mt-2">support@studyagent.ai</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
