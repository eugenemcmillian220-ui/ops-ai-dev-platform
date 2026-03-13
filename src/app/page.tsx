'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, BottomNav, CreditGate, VoiceInput } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; credits: number; isAdmin: boolean } | null>(null);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchUser(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUser(session.user.id);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchUser = async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      setUser({
        id: userId,
        email: data.email,
        credits: data.credits,
        isAdmin: data.is_admin || data.email === 'eugenemcmillian220@gmail.com',
      });
    }
  };

  const handleCreate = async () => {
    if (!prompt.trim() || !session) return;

    if (!user?.isAdmin && user && user.credits < 1) {
      setShowCreditGate(true);
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          name: prompt.slice(0, 30),
        }),
      });

      const data = await response.json();

      if (data.success && data.projectId) {
        router.push(`/projects/${data.projectId}`);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setPrompt(text);
  };

  const handleSignIn = () => {
    router.push('/auth?redirect=/');
  };

  return (
    <div className="min-h-screen pb-20">
      <Header user={user || undefined} />

      <main className="pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Build apps with AI
            </h1>
            <p className="text-zinc-400">
              Describe your idea. Our 8-agent pipeline builds and deploys it.
            </p>
          </div>

          {!session ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-zinc-400 mb-4">Sign in to start building</p>
              <button
                onClick={handleSignIn}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
              <div className="flex gap-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your app idea... e.g., 'A task manager for teams with real-time updates and Slack integration'"
                  className="flex-1 min-h-[120px] bg-zinc-800 border border-zinc-700 rounded-xl p-4 resize-none focus:outline-none focus:border-purple-500"
                  disabled={isCreating}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <VoiceInput
                    onTranscript={handleVoiceTranscript}
                    disabled={isCreating}
                  />
                  <span className="text-xs text-zinc-500 hidden sm:inline">
                    Tap to speak
                  </span>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!prompt.trim() || isCreating}
                  className="flex items-center gap-2 py-3 px-6 bg-purple-600 rounded-lg font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      Build App
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {user && !user.isAdmin && (
                <p className="text-xs text-zinc-500 mt-3">
                  Uses 1 credit • You have {user.credits} credit{user.credits !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="home" />

      <CreditGate
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        credits={user?.credits || 0}
        requiredCredits={1}
      />
    </div>
  );
}
