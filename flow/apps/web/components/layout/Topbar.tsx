'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authClient } from '@/lib/auth/client';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopbarProps {
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function Topbar({ breadcrumbs = [], actions }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const initials = (user?.username ?? user?.email ?? 'U').slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await authClient.signOut();
    clearAuth();
    router.push('/login');
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#21262D] bg-[#0D1117] shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#484F58]">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[#E6EDF3] font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Search hint */}
        <button className="flex items-center gap-2 px-3 h-7 rounded border border-[#30363D] text-xs text-[#484F58] hover:text-[#8B949E] hover:border-[#484F58] transition-colors">
          <span>⌘K</span>
          <span>Search</span>
        </button>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-7 h-7 rounded-full bg-[#388BFD] flex items-center justify-center text-xs font-mono font-semibold text-white hover:ring-2 hover:ring-[#388BFD] hover:ring-offset-2 hover:ring-offset-[#0D1117] transition-all"
          >
            {initials}
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-9 z-50 w-44 rounded-lg border border-[#30363D] bg-[#161B22] shadow-[0_8px_24px_rgba(0,0,0,0.6)] py-1">
                <div className="px-3 py-2 border-b border-[#21262D]">
                  <p className="text-xs font-medium text-[#E6EDF3] truncate">
                    {user?.username ?? user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-[#484F58] truncate">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2333] transition-colors"
                >
                  ◎ Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#F85149] hover:bg-[#1C2333] transition-colors"
                >
                  ↪ Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
