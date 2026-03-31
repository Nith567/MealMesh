'use client';
import { IDKit, orbLegacy, type RpContext } from '@worldcoin/idkit';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useToast } from '@/components/Toast';
import { useSession } from 'next-auth/react';

interface VerifyButtonProps {
  onVerificationSuccess?: () => void;
  size?: 'sm' | 'lg';
  fullWidth?: boolean;
}

/**
 * Reusable Verify with World ID button component
 * Can be used in CreateMeal, BrowseMeals, or anywhere verification is needed
 */
export const VerifyButton = ({ onVerificationSuccess, size = 'lg', fullWidth = true }: VerifyButtonProps) => {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  const onClickVerify = async () => {
    setButtonState('pending');
    try {
      console.log('[VERIFY-BUTTON] Starting verification process');
      console.log('[VERIFY-BUTTON] MiniKit installed:', MiniKit.isInstalled());
      console.log('[VERIFY-BUTTON] MiniKit user:', MiniKit.user);
      
      // Fetch RP signature from your backend
      console.log('[VERIFY-BUTTON] Fetching RP signature...');
      const rpRes = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'meshmeals-action' }),
      });

      if (!rpRes.ok) {
        throw new Error(`Failed to get RP signature: ${rpRes.status} ${rpRes.statusText}`);
      }

      const rpSig = await rpRes.json();
      console.log('[VERIFY-BUTTON] RP signature received:', rpSig);
      
      const rpContext: RpContext = {
        rp_id: rpSig.rp_id,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      };

      console.log('[VERIFY-BUTTON] RP context:', rpContext);

      // Use IDKit request API
      console.log('[VERIFY-BUTTON] Requesting IDKit verification...');
      const request = await IDKit.request({
        app_id: 'app_21851372649567afd6a09de9dad87845',
        action: 'meshmeals-action',
        rp_context: rpContext,
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal: '' }));

      const completion = await request.pollUntilCompletion();

      if (!completion.success) {
        console.error('[VERIFY-BUTTON] IDKit verification failed');
        setButtonState('failed');
        toast.error({
          title: '❌ Verification Failed',
          description: 'Please try again.',
          duration: 5000,
        });
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

      console.log('[VERIFY-BUTTON] Server response status:', response.status);
      const data = await response.json();
      console.log('[VERIFY-BUTTON] Server response data:', data);
      
      if (data.verifyRes && data.verifyRes.success) {
        console.log('[VERIFY-BUTTON] ✅ Verification successful');
        
        // Get nullifier from verification response
        let nullifier = data.verifyRes.nullifier || 'unknown';
        console.log('[VERIFY-BUTTON] Nullifier:', nullifier);
        
        // ALWAYS use NextAuth session username for consistency
        // MiniKit username might be different, but we need to match what CreateMeal/BrowseMeals expects
        const miniKitUser = MiniKit.user;
        const sessionUsername = session?.user?.username;
        const username = sessionUsername || 'User';
        console.log('[VERIFY-BUTTON] Username (MiniKit):', miniKitUser?.username);
        console.log('[VERIFY-BUTTON] Username (Session):', sessionUsername);
        console.log('[VERIFY-BUTTON] Using session username for consistency:', username);
        
        if (username && username !== 'User') {
          try {
            // Save user to database
            console.log('[VERIFY-BUTTON] Saving user to database...');
            
            // Get wallet address using MiniKit.getUserByUsername()
            let walletAddress: string | undefined = undefined;
            try {
              console.log('[VERIFY-BUTTON] Fetching user data from MiniKit for username:', username);
              const miniKitUserData = await MiniKit.getUserByUsername(username);
              walletAddress = miniKitUserData?.walletAddress;
              console.log('[VERIFY-BUTTON] Wallet address from MiniKit.getUserByUsername():', walletAddress);
            } catch (getUserError) {
              console.log('[VERIFY-BUTTON] Could not get user from MiniKit, trying alternatives...');
              // Fallback to direct MiniKit user
              const miniKitUser = MiniKit.user;
              walletAddress = miniKitUser?.walletAddress || session?.user?.walletAddress;
              console.log('[VERIFY-BUTTON] MiniKit direct wallet address:', miniKitUser?.walletAddress);
              console.log('[VERIFY-BUTTON] Session wallet address:', session?.user?.walletAddress);
            }
            console.log('[VERIFY-BUTTON] Final wallet address:', walletAddress);
            
            const saveRes = await fetch('/api/save-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username, // Use the session username we determined above
                worldIdNullifier: nullifier,
                address: walletAddress || null, // Explicitly pass null if no address
              }),
            });

            const saveData = await saveRes.json();
            console.log('[VERIFY-BUTTON] Save user response:', saveData);

            if (saveData.success) {
              console.log('[VERIFY-BUTTON] ✅ User saved successfully');
              // Store verification status in localStorage using username
              localStorage.setItem(`user_verified_${username}`, 'true');
              setButtonState('success');
              
              // Show success toast
              toast.success({
                title: '✅ World ID Verified Successfully!',
                description: `Welcome, ${username}! You can now create and join meals.`,
                duration: 4000,
              });
              
              // Call callback if provided
              onVerificationSuccess?.();
            } else {
              console.error('[VERIFY-BUTTON] ❌ Failed to save user:', saveData.error);
              setButtonState('success');
              
              toast.success({
                title: '✅ Verification Completed!',
                description: `Welcome, ${username}!`,
                duration: 4000,
              });
              
              onVerificationSuccess?.();
            }
          } catch (saveError) {
            console.error('[VERIFY-BUTTON] Error saving user:', saveError);
            setButtonState('success');
            
            toast.success({
              title: '✅ Verification Completed!',
              description: 'You can now create and join meals.',
              duration: 4000,
            });
            
            onVerificationSuccess?.();
          }
        } else {
          console.warn('[VERIFY-BUTTON] No username found in MiniKit or Session user');
          setButtonState('success');
          
          toast.success({
            title: '✅ World ID Verified!',
            description: 'Your World ID has been verified. You can now create and join meals.',
            duration: 4000,
          });
          
          onVerificationSuccess?.();
        }
      } else if (data.verifyRes && !data.verifyRes.success) {
        console.error('[VERIFY-BUTTON] ❌ Verification failed, response:', data);
        setButtonState('failed');
        
        toast.error({
          title: '❌ Verification Failed',
          description: data.verifyRes.error || 'Please try again.',
          duration: 5000,
        });
        
        setTimeout(() => setButtonState(undefined), 2000);
      } else {
        console.error('[VERIFY-BUTTON] Unexpected response format:', data);
        setButtonState('failed');
        
        toast.error({
          title: '❌ Verification Error',
          description: 'Unexpected response format. Please try again.',
          duration: 5000,
        });
        
        setTimeout(() => setButtonState(undefined), 2000);
      }
    } catch (error) {
      console.error('[VERIFY-BUTTON] Error during verification:', error);
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
    <LiveFeedback
      label={{
        failed: 'Verification failed',
        pending: 'Verifying...',
        success: 'Verified!',
      }}
      state={buttonState}
      className={fullWidth ? 'w-full' : ''}
    >
      <Button
        onClick={onClickVerify}
        disabled={buttonState === 'pending'}
        size={size}
        variant="primary"
        className={fullWidth ? 'w-full' : ''}
      >
        {buttonState === 'pending' ? '⏳ Verifying...' : buttonState === 'success' ? '✅ Verified!' : '🌐 Verify with World ID'}
      </Button>
    </LiveFeedback>
  );
};
