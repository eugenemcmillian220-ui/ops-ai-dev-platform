import { supabaseAdmin, getUserById, updateUserCredits, addCreditTransaction } from './db';

const ADMIN_EMAIL = 'eugenemcmillian220@gmail.com';

export async function enforceCredits(
  userId: string,
  projectId: string,
  cost: number = 1
): Promise<{ allowed: boolean; isAdmin: boolean; credits: number }> {
  const user = await getUserById(userId);

  // Admin gets unlimited free access
  if (user.email === ADMIN_EMAIL || user.is_admin) {
    return { allowed: true, isAdmin: true, credits: user.credits };
  }

  if (user.credits < cost) {
    return { allowed: false, isAdmin: false, credits: user.credits };
  }

  // Deduct credits
  const newCredits = user.credits - cost;
  await updateUserCredits(userId, newCredits);
  await addCreditTransaction(userId, 'spend', -cost, `Pipeline execution for project`, projectId);

  return { allowed: true, isAdmin: false, credits: newCredits };
}

export async function refundCredits(userId: string, projectId: string, amount: number = 1) {
  const user = await getUserById(userId);
  const newCredits = user.credits + amount;
  await updateUserCredits(userId, newCredits);
  await addCreditTransaction(userId, 'refund', amount, 'Pipeline failure refund', projectId);
}

export async function grantCredits(userId: string, amount: number, description: string) {
  const user = await getUserById(userId);
  const newCredits = user.credits + amount;
  await updateUserCredits(userId, newCredits);
  await addCreditTransaction(userId, 'grant', amount, description);
}
