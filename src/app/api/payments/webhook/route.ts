import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin, grantCredits } from '@/lib';

// Idempotency tracker (in-memory, 24hr TTL)
const processedEvents = new Map<string, number>();
const EVENT_TTL_MS = 24 * 60 * 60 * 1000;

function isProcessed(id: string): boolean {
  const ts = processedEvents.get(id);
  if (ts && Date.now() - ts < EVENT_TTL_MS) return true;
  if (ts) processedEvents.delete(id);
  return false;
}

function markProcessed(id: string) {
  processedEvents.set(id, Date.now());
  // Cleanup old entries
  for (const [key, ts] of processedEvents) {
    if (Date.now() - ts > EVENT_TTL_MS) processedEvents.delete(key);
  }
}

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    });

    const sig = req.headers.get('stripe-signature');
    const body = await req.text();

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Idempotency check
    if (isProcessed(event.id)) {
      return NextResponse.json({ received: true, skipped: 'already processed' });
    }
    markProcessed(event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0', 10);
        if (userId && credits > 0) {
          await grantCredits(userId, credits, 'Purchase');
        }
        break;
      }
      case 'payment_intent.succeeded': {
        console.log('Payment succeeded:', event.data.object.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        console.log('Payment failed:', event.data.object.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
