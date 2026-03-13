'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, BottomNav } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { Settings, LogOut, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: string; email: string; isAdmin: boolean } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchUser(data.session.user.id);
      } else {
        router.push('/');
      }
    });
  }, []);

  const fetchUser = async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      setUser({
        id: userId,
        email: data.email,
        isAdmin: data.is_admin || data.email === 'eugenemcmillian220@gmail.com',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen pb-20">
      <Header user={user ? { ...user, credits: 0 } : undefined} />

      <main className="pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <div className="space-y-4">
            {/* Account Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="font-medium mb-4">Account</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-zinc-400">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>

                {user?.isAdmin && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded">
                      ADMIN
                    </span>
                    <span className="text-sm text-zinc-400">Unlimited access enabled</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="font-medium mb-4">Actions</h2>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              >
                <LogOut className="w-5 h-5 text-zinc-400" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4">
              <h2 className="font-medium text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-lg hover:bg-red-900/30 transition-colors text-left text-red-400"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-red-900/50 rounded-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-red-400 mb-2">Delete Account?</h3>
                <p className="text-zinc-400 mb-4">
                  This will permanently delete your account and all projects. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Account deletion would go here
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="settings" />
    </div>
  );
}
