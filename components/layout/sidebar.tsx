'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  GraduationCap, LayoutDashboard, Users, Settings,
  LogOut, CreditCard, BookOpen,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: '工作台' },
  { href: '/leads', icon: Users, label: '学生线索' },
  { href: '/settings', icon: Settings, label: '设置' },
  { href: '/billing', icon: CreditCard, label: '订阅' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('已退出登录')
    router.push('/login')
  }

  return (
    <aside className="w-60 h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-40">
      <div className="p-5 border-b border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-indigo-400" />
          <div>
            <div className="font-bold text-sm">StudyAgent</div>
            <div className="text-xs text-gray-400">留学顾问助手</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
