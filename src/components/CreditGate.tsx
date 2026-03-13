'use client';

import { Lock, CreditCard, X } from 'lucide-react';
import Link from 'next/link';

interface CreditGateProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  requiredCredits?: number;
}

export function CreditGate({ isOpen, onClose, credits, requiredCredits = 1 }: CreditGateProps) {
  if (!isOpen) return null;

  const hasEnoughCredits = credits >= requiredCredits;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            {hasEnoughCredits ? (
              <CreditCard className="w-8 h-8 text-green-500" />
            ) : (
              <Lock className="w-8 h-8 text-red-500" />
            )}
          </div>

          <h3 className="text-xl font-bold mb-2">
            {hasEnoughCredits ? 'Confirm Credit Usage' : 'Insufficient Credits'}
          </h3>

          <p className="text-zinc-400 mb-6">
            {hasEnoughCredits
              ? `This action requires ${requiredCredits} credit(s). You have ${credits} credits remaining.`
              : `This action requires ${requiredCredits} credit(s), but you only have ${credits}. Purchase more credits to continue.`}
          </p>

          {hasEnoughCredits ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-white font-medium"
              >
                Use {requiredCredits} Credit
              </button>
            </div>
          ) : (
            <Link
              href="/credits"
              className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-white font-medium flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Buy Credits
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
