'use client'

import Logo from '@/components/logo'

export function SidebarHeader({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex items-center gap-2 p-4 border-b">
      <Logo width={24} height={24} />
      {!isCollapsed && (
        <h2 className="text-sm font-semibold">Palmframe</h2>
      )}
    </div>
  )
}
