'use client';
import { IDKit, orbLegacy, type RpContext } from '@worldcoin/idkit';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { ClockRegular } from '@worldcoin/mini-apps-ui-kit-react/icons';
import { useToast } from '@/components/Toast';
import { useSession } from 'next-auth/react';

/**
 * This component is an example of how to use World ID verification via IDKit.
 * Verification now goes through IDKit end-to-end (both native World App and web).
 * It's critical you verify the proof on the server side.
 * Read More: https://docs.world.org/mini-apps/commands/verify#verifying-the-proof
 */
export const Verify = () => {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);

  const onClickVerify = async () => {
    setButtonState('pending');
    try {
      console.log('[VERIFY-CLIENT] Starting verification process');
      console.log('[VERIFY-CLIENT] MiniKit installed:', MiniKit.isInstalled());
      console.log('[VERIFY-CLIENT] MiniKit user:', MiniKit.user);
      
      // Fetch RP signature from your backend
      console.log('[VERIFY-CLIENT] Fetching RP signature...');
      const rpRes = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'meshmeals-action' }),
      });

      if (!rpRes.ok) {
        throw new Error(`Failed to get RP signature: ${rpRes.status} ${rpRes.statusText}`);
      }

      const rpSig = await rpRes.json();
      console.log('[VERIFY-CLIENT] RP signature received:', rpSig);
      
      const rpContext: RpContext = {
        rp_id: rpSig.rp_id,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      };

      console.log('[VERIFY-CLIENT] RP context:', rpContext);

      // Use IDKit request API
      console.log('[VERIFY-CLIENT] Requesting IDKit verification...');
      console.log('[VERIFY-CLIENT] App ID:', process.env.NEXT_PUBLIC_APP_ID);
      const request = await IDKit.request({
        app_id: 'app_21851372649567afd6a09de9dad87845',
        action: 'meshmeals-action',
        rp_context: rpContext,
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal: '' }));

      const completion = await request.pollUntilCompletion();


      if (!completion.success) {
        console.error('[VERIFY-CLIENT] IDKit verification failed');
        setButtonState('failed');
        setTimeout(() => setButtonState(undefined), 2000);
        return;
      }
      
      // Verify the proof on the server
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        body: JSON.stringify({
          payload: completion.result,
          action: 'meshmeals-action',
        }),
      });

      console.log('[VERIFY-CLIENT] Server response status:', response.status);
      const data = await response.json();
      console.log('[VERIFY-CLIENT] Server response data:', data);
      
      if (data.verifyRes && data.verifyRes.success) {
        console.log('[VERIFY-CLIENT] ✅ Verification successful');
        
        // Get nullifier from verification response
        let nullifier = data.verifyRes.nullifier || 'unknown';
        console.log('[VERIFY-CLIENT] Nullifier:', nullifier);
        
        // Try to get username from MiniKit user, fallback to NextAuth session
        const miniKitUser = MiniKit.user;
        const username = miniKitUser?.username || session?.user?.username || 'User';
        console.log('[VERIFY-CLIENT] Username (MiniKit):', miniKitUser?.username);
        console.log('[VERIFY-CLIENT] Username (Session):', session?.user?.username);
        console.log('[VERIFY-CLIENT] Final username:', username);
        
        if (username && username !== 'User') {
          try {
            // Save user to database
            console.log('[VERIFY-CLIENT] Saving user to database...');
            const saveRes = await fetch('/api/save-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username,
                worldIdNullifier: nullifier,
                address: miniKitUser?.walletAddress || session?.user?.email,
              }),
            });

            const saveData = await saveRes.json();
            console.log('[VERIFY-CLIENT] Save user response:', saveData);

            if (saveData.success) {
              console.log('[VERIFY-CLIENT] ✅ User saved successfully');
              // Store verification status in localStorage
              localStorage.setItem(`user_verified_${saveData.user.id}`, 'true');
              setButtonState('success');
              
              // Show success toast
              toast.success({
                title: '✅ World ID Verified Successfully!',
                description: `Welcome, ${username}! You can now create and join meals.`,
                duration: 4000,
              });
            } else {
              console.error('[VERIFY-CLIENT] ❌ Failed to save user:', saveData.error);
              setButtonState('success'); // Still show success since verification worked
              
              // Show success toast for verification
              toast.success({
                title: '✅ Verification Completed!',
                description: `Welcome, ${username}!`,
                duration: 4000,
              });
            }
          } catch (saveError) {
            console.error('[VERIFY-CLIENT] Error saving user:', saveError);
            setButtonState('success');
            
            // Show success toast for verification
            toast.success({
              title: '✅ Verification Completed!',
              description: 'You can now create and join meals.',
              duration: 4000,
            });
          }
        } else {
          console.warn('[VERIFY-CLIENT] No username found in MiniKit or Session user');
          console.log('[VERIFY-CLIENT] MiniKit user data:', miniKitUser);
          console.log('[VERIFY-CLIENT] Session user data:', session?.user);
          setButtonState('success');
          
          // Fallback: Show success but note that username wasn't found
          toast.success({
            title: '✅ World ID Verified!',
            description: 'Your World ID has been verified. You can now create and join meals.',
            duration: 4000,
          });
        }
      } else if (data.verifyRes && !data.verifyRes.success) {
        console.error('[VERIFY-CLIENT] ❌ Verification failed, response:', data);
        setButtonState('failed');
        
        toast.error({
          title: '❌ Verification Failed',
          description: data.verifyRes.error || 'Please try again.',
          duration: 5000,
        });
        
        setTimeout(() => setButtonState(undefined), 2000);
      } else {
        console.error('[VERIFY-CLIENT] Unexpected response format:', data);
        setButtonState('failed');
        
        toast.error({
          title: '❌ Verification Error',
          description: 'Unexpected response format. Please try again.',
          duration: 5000,
        });
        
        setTimeout(() => setButtonState(undefined), 2000);
      }
    } catch (error) {
      console.error('[VERIFY-CLIENT] Error during verification:', error);
      console.error('[VERIFY-CLIENT] Error message:', error instanceof Error ? error.message : 'Unknown error');
      setButtonState('failed');
      
      toast.error({
        title: '❌ Verification Error',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        duration: 5000,
      });
      
      setTimeout(() => setButtonState(undefined), 2000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Verify</p>
      <LiveFeedback
        label={{
          failed: 'Failed to verify',
          pending: 'Verifying',
          success: 'Verified',
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={onClickVerify}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Verify with World ID
        </Button>
      </LiveFeedback>
    </div>
  );
};
