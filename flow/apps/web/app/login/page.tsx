'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { useAuthStore } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authClient.signIn.email({ email, password, callbackURL: '/dashboard' });
      if (res.error) { setError(res.error.message ?? 'Sign in failed'); return; }
      const session = await authClient.getSession();
      if (session?.data?.session?.token) {
        setAuth(session.data.session.token, {
          userId: session.data.user.id,
          email: session.data.user.email,
          username: (session.data.user as { username?: string }).username,
        });
      }
      router.push('/dashboard');
    } catch {
      setError('Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#080B11]">
      {/* Left panel — animated node graph preview */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#080B11] to-[#0D1117] items-center justify-center">
        <div className="absolute inset-0 opacity-[0.18] animate-drift pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0 0 L6 3 L0 6 z" fill="#388BFD" />
              </marker>
            </defs>
            <rect x="120" y="200" width="130" height="52" rx="8" fill="#161B22" stroke="#388BFD" strokeWidth="1.5" />
            <text x="185" y="230" textAnchor="middle" fill="#388BFD" fontSize="12" fontFamily="IBM Plex Mono, monospace">⚡ Trigger</text>
            <rect x="340" y="120" width="130" height="52" rx="8" fill="#161B22" stroke="#39D353" strokeWidth="1.5" />
            <text x="405" y="150" textAnchor="middle" fill="#39D353" fontSize="12" fontFamily="IBM Plex Mono, monospace">⚙ Action</text>
            <rect x="340" y="290" width="130" height="52" rx="8" fill="#161B22" stroke="#D29922" strokeWidth="1.5" />
            <text x="405" y="320" textAnchor="middle" fill="#D29922" fontSize="12" fontFamily="IBM Plex Mono, monospace">◈ Condition</text>
            <rect x="560" y="200" width="130" height="52" rx="8" fill="#161B22" stroke="#BC8CFF" strokeWidth="1.5" />
            <text x="625" y="230" textAnchor="middle" fill="#BC8CFF" fontSize="12" fontFamily="IBM Plex Mono, monospace">⚙ Action</text>
            <line x1="250" y1="226" x2="340" y2="146" stroke="#388BFD" strokeWidth="1.5" strokeDasharray="6,4" markerEnd="url(#arr)" opacity="0.8" />
            <line x1="250" y1="226" x2="340" y2="316" stroke="#388BFD" strokeWidth="1.5" strokeDasharray="6,4" markerEnd="url(#arr)" opacity="0.8" />
            <line x1="470" y1="146" x2="560" y2="226" stroke="#39D353" strokeWidth="1.5" strokeDasharray="6,4" markerEnd="url(#arr)" opacity="0.8" />
            <line x1="470" y1="316" x2="560" y2="246" stroke="#D29922" strokeWidth="1.5" strokeDasharray="6,4" markerEnd="url(#arr)" opacity="0.8" />
          </svg>
        </div>
        <div className="relative z-10 text-center select-none">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">⚡</span>
            <span className="font-mono font-semibold text-5xl text-[#E6EDF3] tracking-[0.15em]">FLOW</span>
          </div>
          <p className="text-[#8B949E] text-lg mt-2">Automate anything. Visually.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8">
        <div
          className="w-full max-w-sm rounded-xl border border-[#30363D] p-8"
          style={{ background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">⚡</span>
            <span className="font-mono font-semibold text-xl text-[#E6EDF3] tracking-[0.12em]">FLOW</span>
          </div>

          <h1 className="text-xl font-semibold text-[#E6EDF3] mb-1">Welcome back</h1>
          <p className="text-sm text-[#8B949E] mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 text-sm bg-[#080B11] text-[#E6EDF3] placeholder:text-[#484F58] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 text-sm bg-[#080B11] text-[#E6EDF3] placeholder:text-[#484F58] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)] transition-all"
              />
            </div>

            {error && <p className="text-sm text-[#F85149]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md text-sm font-medium text-white bg-[#388BFD] hover:bg-[#4596FF] hover:shadow-[0_0_20px_rgba(56,139,253,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="text-sm text-[#8B949E] text-center mt-6">
            No account?{' '}
            <Link href="/signup" className="text-[#58A6FF] hover:text-[#388BFD] transition-colors">
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
