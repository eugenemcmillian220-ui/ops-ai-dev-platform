import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin, grantCredits } from '@/lib';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Idempotency tracking (in-memory for now, use Redis in production)
const processedEvents = new Map<string, number>();
const EVENT_TTL_MS = 24 * 60 * 60 * 1000;

function isProcessed(id: string): boolean {
  const ts = processedEvents.get(id);
  if (!ts) return false;
  if (Date.now() - ts > EVENT_TTL_MS) {
    processedEvents.delete(id);
    return false;
  }
  return true;
}

function markProcessed(id: string) {
  processedEvents.set(id, Date.now());
  // Cleanup old entries
  for (const [key, ts] of processedEvents) {
    if (Date.now() - ts > EVENT_TTL_MS) processedEvents.delete(key);
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Idempotency check
  if (isProcessed(event.id)) {
    return NextResponse.json({ received: true, skipped: 'already processed' });
  }
  markProcessed(event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get customer info from metadata
        const userId = session.metadata?.userId;
        const creditAmount = parseInt(session.metadata?.credits || '10', 10);

        if (userId) {
          await grantCredits(userId, creditAmount, `Purchased via Stripe`);
          
          // Record the transaction
          await supabaseAdmin.from('credit_transactions').insert({
            user_id: userId,
            type: 'purchase',
            amount: creditAmount,
            description: 'Credit purchase',
            stripe_payment_intent_id: session.payment_intent as string,
          });
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
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
