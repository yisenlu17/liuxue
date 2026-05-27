'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('密码至少需要 6 位')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        name,
        role: 'owner',
        onboarding_completed: false,
      })
      toast.success('注册成功！即将跳转到配置页面...')
      router.push('/onboarding')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <GraduationCap size={36} />
            <span className="text-2xl font-bold">StudyAgent</span>
          </div>
          <p className="text-sm text-gray-500">留学顾问 AI 成交助手</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>创建账号</CardTitle>
            <CardDescription>开始使用 AI 留学方案助手，免费试用 3 次</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">您的姓名</Label>
                <Input
                  id="name"
                  placeholder="张顾问"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码（至少 6 位）</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 注册中...</> : '免费注册'}
              </Button>
              <p className="text-sm text-center text-gray-500">
                已有账号？{' '}
                <Link href="/login" className="text-indigo-600 hover:underline font-medium">
                  立即登录
                </Link>
              </p>
              <p className="text-xs text-center text-gray-400">
                注册即表示您同意我们的服务条款和隐私政策
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
