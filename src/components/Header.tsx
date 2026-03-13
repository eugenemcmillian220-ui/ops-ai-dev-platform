'use client';

import { useState, useEffect } from 'react';
import { Sparkles, User, Menu, X, CreditCard } from 'lucide-react';

interface HeaderProps {
  user?: { email: string; credits: number; isAdmin?: boolean } | null;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-zinc-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <span className="font-bold text-lg hidden sm:inline">OPS AI DEV</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            {user.isAdmin ? (
              <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                ADMIN
              </span>
            ) : (
              <div className="flex items-center gap-1 text-sm text-zinc-400">
                <CreditCard className="w-4 h-4" />
                <span>{user.credits} credits</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <span className="hidden md:inline text-sm text-zinc-400">{user.email}</span>
            </div>
          </>
        )}
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 bg-zinc-900 lg:hidden z-40">
          <nav className="p-4 space-y-2">
            <a href="/" className="block p-3 rounded-lg hover:bg-zinc-800">Dashboard</a>
            <a href="/projects" className="block p-3 rounded-lg hover:bg-zinc-800">My Projects</a>
            <a href="/credits" className="block p-3 rounded-lg hover:bg-zinc-800">Buy Credits</a>
          </nav>
        </div>
      )}
    </header>
  );
}
