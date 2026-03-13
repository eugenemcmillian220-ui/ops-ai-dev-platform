'use client';

import { Home, FolderOpen, Plus, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';

interface BottomNavProps {
  activeTab?: string;
}

export function BottomNav({ activeTab = 'home' }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/projects' },
    { id: 'create', label: 'Create', icon: Plus, href: '/create', isAction: true },
    { id: 'credits', label: 'Credits', icon: CreditCard, href: '/credits' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-2 z-50 pb-safe">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (tab.isAction) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex items-center justify-center w-14 h-14 bg-purple-600 rounded-full -mt-6 shadow-lg shadow-purple-900/50 hover:bg-purple-500 transition-colors"
            >
              <Icon className="w-6 h-6 text-white" />
            </Link>
          );
        }

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
              isActive ? 'text-purple-400' : 'text-zinc-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
