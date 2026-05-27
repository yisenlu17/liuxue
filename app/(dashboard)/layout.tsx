'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <Topbar lang={lang} onLangChange={setLang} />
        <main className="flex-1 pt-14 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
