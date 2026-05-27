'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Building2, Bot, Globe } from 'lucide-react'
import type { Organization } from '@/types'

const COUNTRIES = ['UK', 'AU', 'US', 'CA', 'SG', 'NZ', 'IE', 'NL', 'DE', 'HK']
const LEVELS = [
  { value: 'high_school', label: '高中' },
  { value: 'foundation', label: '预科' },
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
  { value: 'language', label: '语言课程' },
]

export default function SettingsPage() {
  const [org, setOrg] = useState<Partial<Organization>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadOrg() }, [])

  async function loadOrg() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) { setLoading(false); return }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    if (orgData) setOrg(orgData)
    setLoading(false)
  }

  async function handleSave() {
    if (!org.id) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        contact_email: org.contact_email,
        wechat: org.wechat,
        whatsapp: org.whatsapp,
        country: org.country,
        city: org.city,
        service_countries: org.service_countries,
        service_levels: org.service_levels,
        ai_provider: org.ai_provider,
        default_language: org.default_language,
      })
      .eq('id', org.id)

    if (error) {
      toast.error('保存失败：' + error.message)
    } else {
      toast.success('设置已保存')
    }
    setSaving(false)
  }

  function toggleCountry(c: string) {
    setOrg(prev => {
      const current = prev.service_countries || []
      return {
        ...prev,
        service_countries: current.includes(c)
          ? current.filter(x => x !== c)
          : [...current, c],
      }
    })
  }

  function toggleLevel(v: string) {
    setOrg(prev => {
      const current = prev.service_levels || []
      return {
        ...prev,
        service_levels: current.includes(v)
          ? current.filter(x => x !== v)
          : [...current, v],
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground text-sm mt-1">管理机构信息、AI 配置和系统偏好</p>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            机构信息
          </CardTitle>
          <CardDescription>此信息将出现在导出的 PDF 方案封面和联系页</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>机构名称 *</Label>
              <Input
                value={org.name || ''}
                onChange={e => setOrg(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例：优学留学顾问中心"
              />
            </div>
            <div className="space-y-1.5">
              <Label>联系邮箱</Label>
              <Input
                type="email"
                value={org.contact_email || ''}
                onChange={e => setOrg(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="info@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>微信号</Label>
              <Input
                value={org.wechat || ''}
                onChange={e => setOrg(prev => ({ ...prev, wechat: e.target.value }))}
                placeholder="微信号或公众号"
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={org.whatsapp || ''}
                onChange={e => setOrg(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+60 12-xxx xxxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label>所在国家/地区</Label>
              <Input
                value={org.country || ''}
                onChange={e => setOrg(prev => ({ ...prev, country: e.target.value }))}
                placeholder="例：马来西亚"
              />
            </div>
            <div className="space-y-1.5">
              <Label>城市</Label>
              <Input
                value={org.city || ''}
                onChange={e => setOrg(prev => ({ ...prev, city: e.target.value }))}
                placeholder="例：吉隆坡"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            服务范围
          </CardTitle>
          <CardDescription>选择你们机构覆盖的目标国家和留学阶段</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>服务国家（可多选）</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COUNTRIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCountry(c)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    (org.service_countries || []).includes(c)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>服务阶段（可多选）</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => toggleLevel(l.value)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    (org.service_levels || []).includes(l.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI & Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI 与语言配置
          </CardTitle>
          <CardDescription>选择默认 AI 提供商和界面语言</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>AI 提供商</Label>
              <Select
                value={org.ai_provider || 'claude'}
                onValueChange={v => setOrg(prev => ({ ...prev, ai_provider: v as 'claude' | 'openai' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude (Anthropic) — 推荐</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">需在服务器配置对应 API Key</p>
            </div>
            <div className="space-y-1.5">
              <Label>默认界面语言</Label>
              <Select
                value={org.default_language || 'zh'}
                onValueChange={v => setOrg(prev => ({ ...prev, default_language: v as 'zh' | 'en' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          保存设置
        </Button>
      </div>
    </div>
  )
}
