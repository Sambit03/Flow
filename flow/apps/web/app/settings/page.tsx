'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { useAuthStore } from '@/store';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
}

async function getToken(): Promise<string | null> {
  const { data } = await authClient.getSession();
  return data?.session?.token ?? useAuthStore.getState().token;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, clearAuth, setAuth } = useAuthStore();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setUsername(data.username ?? '');
        }
      } catch {
        toast('Failed to load profile', { type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, toast]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setProfile(updated);
      if (user) setAuth(useAuthStore.getState().token!, { ...user, username: updated.username });
      toast('Profile updated', { type: 'success' });
    } catch {
      toast('Failed to save profile', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    clearAuth();
    router.push('/login');
  }

  const initials = (username || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[560px] mx-auto flex flex-col gap-6">
          {/* Profile section */}
          <section className="bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#21262D]">
              <h2 className="text-sm font-semibold text-[#E6EDF3]">Profile</h2>
            </div>
            <div className="px-6 py-5">
              {loading ? (
                <div className="flex flex-col gap-4">
                  <div className="h-14 skeleton rounded-lg" />
                  <div className="h-9 skeleton rounded" />
                  <div className="h-9 skeleton rounded" />
                </div>
              ) : (
                <form onSubmit={handleSave} className="flex flex-col gap-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#388BFD] flex items-center justify-center text-xl font-mono font-semibold text-white shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#E6EDF3]">{username || user?.email?.split('@')[0]}</p>
                      <p className="text-xs text-[#484F58] mt-0.5">{user?.email}</p>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="username" className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">Username</label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="yourname"
                      className="w-full h-9 px-3 text-sm bg-[#080B11] text-[#E6EDF3] placeholder:text-[#484F58] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)] transition-all"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={profile?.email ?? user?.email ?? ''}
                      readOnly
                      className="w-full h-9 px-3 text-sm bg-[#080B11] text-[#484F58] border border-[#21262D] rounded-md outline-none cursor-not-allowed"
                    />
                    <p className="text-xs text-[#484F58]">Email cannot be changed</p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" loading={saving}>Save Changes</Button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-[#0D1117] border border-[rgba(248,81,73,0.2)] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(248,81,73,0.15)]">
              <h2 className="text-sm font-semibold text-[#F85149]">Danger Zone</h2>
            </div>
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#E6EDF3]">Sign out</p>
                <p className="text-xs text-[#8B949E] mt-0.5">You will be redirected to the login page.</p>
              </div>
              <Button variant="danger" loading={signingOut} onClick={handleSignOut} type="button">
                Sign out
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
