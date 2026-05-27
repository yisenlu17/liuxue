'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, LogOut, Settings, Zap } from 'lucide-react'
import type { UserProfile, Organization } from '@/types'

interface TopbarProps {
  title?: string
  lang: 'zh' | 'en'
  onLangChange: (lang: 'zh' | 'en') => void
}

export function Topbar({ title, lang, onLangChange }: TopbarProps) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [plan, setPlan] = useState('free')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, organization_id, organizations(subscription_plan)')
        .eq('id', user.id)
        .single()
      if (profile) {
        setUserName((profile as any).name || user.email || '')
        const org = (profile as any).organizations
        if (org) setPlan(org.subscription_plan)
      }
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const planBadge = plan === 'free' ? { label: 'Free', color: 'secondary' as const } : { label: plan.toUpperCase(), color: 'default' as const }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-60 right-0 z-30">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-3">
        <Badge variant={planBadge.color} className="text-xs">
          {planBadge.label}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLangChange(lang === 'zh' ? 'en' : 'zh')}
          className="gap-1.5 text-gray-600"
        >
          <Globe className="w-4 h-4" />
          {lang === 'zh' ? '中文' : 'EN'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 transition-colors cursor-pointer border-none bg-transparent outline-none">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-600 text-white text-xs">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{plan} plan</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              设置
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/billing')}>
              <Zap className="mr-2 h-4 w-4" />
              升级套餐
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
