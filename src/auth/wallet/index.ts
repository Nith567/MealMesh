import { MiniKit } from '@worldcoin/minikit-js';
import { signIn } from 'next-auth/react';
import { getNewNonces } from './server-helpers';

/**
 * Authenticates a user via their wallet using a nonce-based challenge-response mechanism.
 *
 * This function generates a unique `nonce` and requests the user to sign it with their wallet,
 * producing a `signedNonce`. The `signedNonce` ensures the response we receive from wallet auth
 * is authentic and matches our session creation.
 *
 * @returns {Promise<SignInResponse>} The result of the sign-in attempt.
 * @throws {Error} If wallet authentication fails at any step.
 */
export const walletAuth = async () => {
  const { nonce, signedNonce } = await getNewNonces();

  try {
    const result = await Promise.race([
      MiniKit.walletAuth({
        nonce,
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        statement: `Authenticate (${crypto.randomUUID().replace(/-/g, '')}).`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Wallet auth timeout after 30 seconds')), 30000)
      ),
    ]);
    console.log('Result', result);

    await signIn('credentials', {
      redirectTo: '/home',
      nonce,
      signedNonce,
      finalPayloadJson: JSON.stringify({
        status: 'success',
        address: (result as any).data.address,
        message: (result as any).data.message,
        signature: (result as any).data.signature,
      }),
    });
  } catch (error) {
    console.error('Wallet auth error:', error);
    throw error;
  }
};
