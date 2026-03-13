'use client';

import { useState, useEffect } from 'react';
import { Header, BottomNav } from '@/components';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';

const creditPackages = [
  { id: 'basic', credits: 5, price: 5, name: 'Starter' },
  { id: 'pro', credits: 20, price: 15, name: 'Pro', popular: true },
  { id: 'enterprise', credits: 100, price: 50, name: 'Enterprise' },
];

export default function Credits() {
  const [user, setUser] = useState<{ id: string; email: string; credits: number; isAdmin: boolean } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchUser(data.session.user.id);
      }
    });
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

  const handlePurchase = async (pkg: typeof creditPackages[0]) => {
    if (!session?.user) return;
    
    setLoading(pkg.id);
    
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          packageId: pkg.id,
          credits: pkg.credits,
          price: pkg.price,
        }),
      });

      const data = await response.json();

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Failed to initiate purchase');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header user={user || undefined} />

      <main className="pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-4">
              <CreditCard className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
            <p className="text-zinc-400">
              Credits are used to build and deploy apps
            </p>
            {user && !user.isAdmin && (
              <p className="text-zinc-500 mt-2">
                Current balance: <span className="text-purple-400 font-medium">{user.credits}</span> credits
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-zinc-900 border rounded-2xl p-6 ${
                  pkg.popular
                    ? 'border-purple-500/50 ring-1 ring-purple-500/20'
                    : 'border-zinc-800'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-xs font-medium rounded-full">
                    Popular
                  </span>
                )}

                <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                <p className="text-3xl font-bold text-purple-400 mb-4">
                  ${pkg.price}
                </p>
                <p className="text-zinc-400 text-sm mb-6">
                  {pkg.credits} credits
                  <br />
                  <span className="text-zinc-500">
                    ${(pkg.price / pkg.credits).toFixed(2)} per credit
                  </span>
                </p>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={!!loading || !session}
                  className={`w-full py-3 rounded-lg font-medium transition-colors min-h-[48px] flex items-center justify-center gap-2 ${
                    pkg.popular
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  } disabled:opacity-50`}
                >
                  {loading === pkg.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">What can I build?</p>
                <p className="text-sm text-zinc-400">
                  Each credit allows you to build one complete app with our 8-agent pipeline. 
                  The app includes a full codebase, database schema, API routes, and deployment 
                  to both Vercel and Netlify.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav activeTab="credits" />
    </div>
  );
}
