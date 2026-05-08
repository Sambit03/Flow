'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authClient } from '@/lib/auth/client';
import { Tooltip } from '@/components/ui/Tooltip';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞', exact: true },
  { href: '/settings',  label: 'Settings',  icon: '◎' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  async function handleSignOut() {
    await authClient.signOut();
    clearAuth();
    router.push('/login');
  }

  const initials = (user?.username ?? user?.email ?? 'U').slice(0, 2).toUpperCase();

  return (
    <aside
      className="flex flex-col shrink-0 h-full bg-[#0D1117] border-r border-[#21262D] transition-all duration-[200ms]"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[#21262D] shrink-0">
        <span className="text-[#388BFD] text-lg">⚡</span>
        {!collapsed && (
          <span className="font-mono font-semibold text-[#E6EDF3] tracking-widest text-sm">
            FLOW
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 h-9 rounded-md transition-colors duration-[120ms] relative',
                collapsed ? 'justify-center px-0' : 'px-3',
                active
                  ? 'bg-[#1C2333] text-[#E6EDF3]'
                  : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3]',
              ].join(' ')}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-[#388BFD]"
                />
              )}
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href} content={item.label} side="right">
              {linkContent}
            </Tooltip>
          ) : linkContent;
        })}
      </nav>

      {/* Bottom — user + collapse */}
      <div className="border-t border-[#21262D] p-2 shrink-0">
        {/* User info */}
        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-[#161B22] transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="shrink-0 w-7 h-7 rounded-full bg-[#388BFD] flex items-center justify-center text-xs font-mono font-semibold text-white"
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#E6EDF3] truncate">
                {user?.username ?? user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-[#484F58] truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <Tooltip content="Sign out" side="right">
              <button
                onClick={handleSignOut}
                className="text-[#484F58] hover:text-[#F85149] text-sm transition-colors p-1"
              >
                ↪
              </button>
            </Tooltip>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={[
            'w-full flex items-center justify-center mt-1 h-7 rounded-md text-xs',
            'text-[#484F58] hover:text-[#8B949E] hover:bg-[#161B22] transition-colors',
          ].join(' ')}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>
    </aside>
  );
}
