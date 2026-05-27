'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { GraduationCap, Loader2, Check, Brain, Zap } from 'lucide-react'
import type { AIProvider, Language } from '@/types'

const SERVICE_COUNTRIES = [
  { value: 'UK', label: '英国' },
  { value: 'AU', label: '澳洲' },
  { value: 'SG', label: '新加坡' },
  { value: 'US', label: '美国' },
  { value: 'CA', label: '加拿大' },
  { value: 'HK', label: '香港' },
  { value: 'EU', label: '欧洲' },
  { value: 'MY', label: '马来西亚' },
  { value: 'JP', label: '日本' },
  { value: 'NZ', label: '新西兰' },
]

const SERVICE_LEVELS = [
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
  { value: 'foundation', label: '预科' },
  { value: 'high_school', label: '国际高中' },
  { value: 'language_school', label: '语言班' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [wechat, setWechat] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('zh')

  const [aiProvider, setAiProvider] = useState<AIProvider>('claude')

  function toggleCountry(value: string) {
    setSelectedCountries(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function toggleLevel(value: string) {
    setSelectedLevels(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  async function handleFinish() {
    if (!companyName.trim()) {
      toast.error('请填写公司/工作室名称')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        wechat,
        whatsapp,
        default_language: defaultLanguage,
        service_countries: selectedCountries,
        service_levels: selectedLevels,
        ai_provider: aiProvider,
        subscription_plan: 'free',
      })
      .select()
      .single()

    if (orgError) {
      toast.error('创建公司信息失败：' + orgError.message)
      setLoading(false)
      return
    }

    await supabase.from('user_profiles').update({
      organization_id: org.id,
      name: contactName || user.user_metadata?.name,
      onboarding_completed: true,
    }).eq('id', user.id)

    toast.success('配置完成！正在进入工作台...')
    router.push('/dashboard')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <GraduationCap size={32} />
            <span className="text-xl font-bold">StudyAgent Copilot</span>
          </div>
          <p className="text-sm text-gray-500">配置您的工作台</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>步骤 {step} / 3</span>
            <span>{step === 1 ? '公司信息' : step === 2 ? '服务范围' : 'AI 设置'}</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {step === 1 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>公司基础信息</CardTitle>
              <CardDescription>这些信息将出现在您生成的方案和 PDF 中</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">公司/工作室名称 <span className="text-red-500">*</span></Label>
                <Input id="company" placeholder="例如：新航道留学" value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">联系人姓名</Label>
                <Input id="contact" placeholder="例如：张顾问" value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wechat">微信号</Label>
                  <Input id="wechat" placeholder="微信号" value={wechat} onChange={e => setWechat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" placeholder="+65..." value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>方案默认语言</Label>
                <div className="flex gap-3">
                  {(['zh', 'en'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setDefaultLanguage(lang)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${defaultLanguage === lang ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                    >
                      {lang === 'zh' ? '🇨🇳 中文' : '🇬🇧 English'}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => setStep(2)} disabled={!companyName.trim()}>
                下一步
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>服务范围</CardTitle>
              <CardDescription>帮助 AI 更好地为您的学生生成方案</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>主要服务国家（可多选）</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_COUNTRIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => toggleCountry(c.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedCountries.includes(c.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                    >
                      {selectedCountries.includes(c.value) && <Check className="inline w-3 h-3 mr-1" />}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>主要服务阶段（可多选）</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_LEVELS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => toggleLevel(l.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedLevels.includes(l.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                    >
                      {selectedLevels.includes(l.value) && <Check className="inline w-3 h-3 mr-1" />}
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>上一步</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>下一步</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI 设置</CardTitle>
              <CardDescription>选择您的 AI 方案生成引擎（可在设置中随时切换）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { value: 'claude' as AIProvider, icon: Brain, name: 'Claude（推荐）', desc: 'Anthropic Claude，中文理解更强，方案质量更高', badge: '推荐' },
                  { value: 'openai' as AIProvider, icon: Zap, name: 'OpenAI GPT-4', desc: 'OpenAI GPT-4o，稳定可靠，全球领先', badge: '' },
                ].map(({ value, icon: Icon, name, desc, badge }) => (
                  <button
                    key={value}
                    onClick={() => setAiProvider(value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${aiProvider === value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${aiProvider === value ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{name}</span>
                          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                      </div>
                      {aiProvider === value && <Check className="w-5 h-5 text-indigo-600" />}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                💡 两者都需要填写对应的 API Key。如未配置，方案生成将不可用。
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>上一步</Button>
                <Button className="flex-1" onClick={handleFinish} disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 配置中...</> : '完成配置 🎉'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
