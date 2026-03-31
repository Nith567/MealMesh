'use client';

import { abi as MealMeshABI } from '@/MealMesh/abi';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface MealData {
  date: number;
  date_str?: string;
  time_str?: string;
  city?: string;
  country?: string;
  restaurant?: string;
  latitude?: number;
  longitude?: number;
  cuisine?: string;
  description?: string;
  maxGuests?: number;
  hostId?: string;
  hostUsername?: string;
  hostAddress?: string;
}

interface JoinMealData {
  mealId: string;
  guestUsername: string;
  guestId: string;
  restaurant: string;
  hostUsername: string;
  date: string;
  time: string;
}

export const Transaction = ({ mealData, onMealCreated, onMealJoined }: { mealData?: MealData; onMealCreated?: (mealId: string) => void; onMealJoined?: (mealId: string) => void }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const MEALMESH_CONTRACT = '0xe55EF92a76C17A39F9862e4C456D583cfC4242E2';
  const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
  const WLD = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003';
  const PLATFORM = '0x6121A6039a1Dc67a9dB8BDdD1dE3Bb2d3f9ED2B0';
  const FEE = '1000000000000000'; // 0.001 WLD in wei
  
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);
  const [txHash, setTxHash] = useState<string>('');
  const [demoError, setDemoError] = useState<string>('');
  const [stepLogs, setStepLogs] = useState<string[]>([]);

  useEffect(() => {
    console.log('MiniKit installed:', MiniKit.isInstalled());
  }, []);

  // Add step log
  const addLog = (message: string) => {
    console.log('[TRANSACTION]', message);
    setStepLogs(prev => [...prev, message]);
  };

  // Handle real meal creation from CreateMeal component
  const handleCreateMealFromForm = async (mealData: MealData) => {
    try {
      addLog('🎬 REAL MEAL CREATION: Starting...');
      setDemoError('');
      setButtonState('pending');
      setStepLogs([]);

      // STEP 1: Save meal to database FIRST to get real mealId
      addLog('⏳ STEP 1: Saving meal to database...');
      
      const dbPayload = {
        hostId: mealData.hostId,
        hostUsername: mealData.hostUsername,
        hostAddress: mealData.hostAddress,
        restaurant: mealData.restaurant,
        city: mealData.city,
        country: mealData.country,
        latitude: mealData.latitude,
        longitude: mealData.longitude,
        date: mealData.date_str,
        time: mealData.time_str,
        cuisine: mealData.cuisine,
        description: mealData.description,
        maxGuests: mealData.maxGuests,
        stakeAmount: 0,
      };

      addLog('Sending to /api/create-meal...');
      const dbResponse = await fetch('/api/create-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });

      addLog(`Database response status: ${dbResponse.status}`);
      const dbData = await dbResponse.json();
      addLog(`Database response received: ${JSON.stringify(dbData)}`);
      
      if (!dbData.success || !dbData.meal) {
        addLog(`❌ STEP 1 FAILED: Database response error`);
        throw new Error(dbData.error || 'Failed to save meal to database');
      }

      const realMealId = dbData.meal.id;
      addLog(`✅ STEP 1 COMPLETE: Meal saved with ID: ${realMealId}`);
      addLog(`📝 Database meal object: ${JSON.stringify(dbData.meal)}`);

      // STEP 2: Call smart contract with real mealId
      addLog('⏳ STEP 2: Calling smart contract with real meal ID...');
      
      const username = session?.user?.username;
      if (!username) {
        throw new Error('No username in session');
      }
      
      addLog(`Getting wallet address from MiniKit for: ${username}`);
      const userDetails = await (MiniKit as any).getUserByUsername(username);
      const walletAddress = userDetails?.walletAddress;
      
      if (!walletAddress) {
        throw new Error('Could not get wallet address from MiniKit');
      }

      addLog(`Got wallet: ${walletAddress}`);

      // Prepare Permit2 structure
      const permitTransfer = {
        permitted: { token: WLD, amount: FEE },
        nonce: Date.now().toString(),
        deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(),
      };

      addLog('Sending createMeal() to smart contract...');
      addLog(`Real meal ID: ${realMealId}`);
      addLog(`Meal date: ${mealData.date}`);

      // Call smart contract with REAL meal ID from database
      addLog('⏳ Calling smart contract...');
      console.log('[TRANSACTION] About to call sendTransaction');
      
      const rawResponse = await (MiniKit as any).sendTransaction({
        transaction: [
          {
            address: MEALMESH_CONTRACT,
            abi: MealMeshABI,
            functionName: 'createMeal',
            args: [
              realMealId,  // ✅ REAL meal ID from database
              mealData.date,  // ✅ Real meal timestamp
              [
                [permitTransfer.permitted.token, permitTransfer.permitted.amount],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              [PLATFORM, FEE],
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
        ],
        permit2: [
          {
            permitted: { token: WLD, amount: FEE },
            nonce: permitTransfer.nonce,
            deadline: permitTransfer.deadline,
            spender: MEALMESH_CONTRACT,
          },
        ],
      });

      addLog(`📊 RAW: ${JSON.stringify(rawResponse)}`);
      console.log('[TRANSACTION] RAW RESPONSE:', rawResponse);

      // The response structure is: { executedWith, data: { status, transactionId, transaction_id, ... } }
      const data = rawResponse?.data;
      const status = data?.status;
      const txId = data?.transaction_id;

      addLog(`Status: ${status}, TxId: ${txId}`);

      if (status === 'success' && txId) {
        addLog('✅ STEP 2 COMPLETE: Smart contract transaction successful!');
        addLog(`Transaction ID: ${txId}`);
        
        // STEP 3: Update database with transaction ID
        addLog('⏳ STEP 3: Updating database with transaction ID...');
        
        const updateResponse = await fetch(`/api/update-meal/${realMealId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: txId }),
        });

        addLog(`Update response status: ${updateResponse.status}`);
        const updateText = await updateResponse.text();
        addLog(`Update response text: ${updateText.substring(0, 200)}`);
        
        let updateData;
        try {
          updateData = JSON.parse(updateText);
        } catch (e) {
          throw new Error(`Failed to parse update response: ${updateText.substring(0, 200)}`);
        }
        
        if (updateData.success || updateData.meal) {
          addLog('✅ STEP 3 COMPLETE: Meal updated with transaction ID!');
          addLog('✅✅✅ ALL STEPS COMPLETE - MEAL CREATION SUCCESSFUL! ✅✅✅');
          setButtonState('success');
          setTxHash(txId);
          
          // Dispatch success event for CreateMeal component
          window.dispatchEvent(new CustomEvent('mealCreatedSuccess', { detail: { mealId: realMealId } }));
          
          if (onMealCreated) {
            onMealCreated(realMealId);
          }
        } else {
          throw new Error(updateData.error || 'Failed to update meal with transaction ID');
        }

      } else if (status === 'error') {
        addLog(`❌ STEP 2 FAILED: ${data?.error}`);
        setButtonState('failed');
        setDemoError(data?.error || 'Transaction failed');
        setTimeout(() => router.push('/?tab=home'), 1000);

      } else {
        throw new Error(`Unexpected status: ${status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ERROR: ${errorMsg}`);
      setButtonState('failed');
      setDemoError(errorMsg);
    } finally {
      // Safety net — if somehow buttonState never updated
      setButtonState(prev => prev === 'pending' ? 'failed' : prev);
    }
  };

  // Load meal and trigger demo contract interaction
  const loadAndTriggerDemo = async () => {
    try {
      console.log('[DEMO] 🎬 DEMO MODE: Starting smart contract test...');
      setDemoError('');
      setButtonState('pending');

      // Generate random meal ID
      const randomMealId = `meal_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[DEMO] Generated random mealId:', randomMealId);

      // Set date to June 19, 2026 (future timestamp)
      const mealDate = Math.floor(new Date('2026-06-19T12:00:00Z').getTime() / 1000);
      console.log('[DEMO] Set meal date to June 19, 2026 (timestamp:', mealDate, ')');

      // Get username from session (real username)
      const username = session?.user?.username;
      if (!username) {
        throw new Error('No username in session');
      }
      console.log('[DEMO] Username from session:', username);

      // Get wallet address from MiniKit using real username
      console.log('[DEMO] Fetching wallet address from MiniKit for:', username);
      const userDetails = await (MiniKit as any).getUserByUsername(username);
      const walletAddress = userDetails?.walletAddress;
      console.log('[DEMO] Wallet address from MiniKit:', walletAddress);

      if (!walletAddress) {
        throw new Error('Could not get wallet address from MiniKit');
      }

      // Prepare Permit2 structure
      const permitTransfer = {
        permitted: { token: WLD, amount: FEE },
        nonce: Date.now().toString(),
        deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(),
      };

      console.log('[DEMO] Permit2 structure:', permitTransfer);
      console.log('[DEMO] ⏳ Sending createMeal() transaction to smart contract...');
      console.log('[DEMO] Contract address:', MEALMESH_CONTRACT);
      console.log('[DEMO] Function: createMeal');
      console.log('[DEMO] Args:', [
        randomMealId,
        mealDate,
        [
          [permitTransfer.permitted.token, permitTransfer.permitted.amount],
          permitTransfer.nonce,
          permitTransfer.deadline,
        ],
        [PLATFORM, FEE],
        'PERMIT2_SIGNATURE_PLACEHOLDER_0',
      ]);

      // Call smart contract
      const { finalPayload } = await (MiniKit as any).sendTransaction({
        transaction: [
          {
            address: MEALMESH_CONTRACT,
            abi: MealMeshABI,
            functionName: 'createMeal',
            args: [
              randomMealId,
              mealDate,
              [
                [permitTransfer.permitted.token, permitTransfer.permitted.amount],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              [PLATFORM, FEE],
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
        ],
        permit2: [
          {
            permitted: { token: WLD, amount: FEE },
            nonce: permitTransfer.nonce,
            deadline: permitTransfer.deadline,
            spender: MEALMESH_CONTRACT,
          },
        ],
      });

      console.log('[DEMO] ✅ Smart contract response:', finalPayload);
      
      if (finalPayload?.status === 'success') {
        console.log('[DEMO] ✅✅✅ CONTRACT CALL SUCCESSFUL! ✅✅✅');
        console.log('[DEMO] Transaction ID:', finalPayload.transaction_id);
        console.log('[DEMO] Meal created on-chain with ID:', randomMealId);
        setButtonState('success');
        setTxHash(finalPayload.transaction_id);
      } else if (finalPayload?.status === 'error') {
        console.error('[DEMO] ❌ Transaction cancelled or failed:', finalPayload);
        setButtonState('failed');
        setDemoError(finalPayload?.error || 'Transaction cancelled by user');
        
        // Redirect to home tab after 2 seconds
   /*      setTimeout(() => { */
          router.push('/?tab=home');
  /*       }, 2000); */
      }
    } catch (error) {
      console.error('[DEMO] ❌ Error:', error);
      setButtonState('failed');
      setDemoError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Handle joining meal from Browse component
  const handleJoinMealFromBrowse = async (joinData: JoinMealData) => {
    try {
      addLog('🎬 JOINING MEAL: Starting...');
      setDemoError('');
      setButtonState('pending');
      setStepLogs([]);

      // STEP 1: Update database to add guest to meal
      addLog('⏳ STEP 1: Adding guest to meal in database...');
      
      const dbPayload = {
        mealId: joinData.mealId,
        userId: joinData.guestId,
        username: joinData.guestUsername,
        transactionId: `pending_${Date.now()}`,  // Temporary ID, will be updated after smart contract
      };

      console.log('[TRANSACTION] Joining meal with data:', dbPayload);
      addLog('Sending to /api/join-meal...');
      
      const dbResponse = await fetch('/api/join-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });

      addLog(`Database response status: ${dbResponse.status}`);
      const dbData = await dbResponse.json();
      addLog(`Database response received: ${JSON.stringify(dbData)}`);
      
      if (!dbData.success) {
        addLog(`❌ STEP 1 FAILED: Database response error`);
        throw new Error(dbData.error || 'Failed to join meal in database');
      }

      addLog(`✅ STEP 1 COMPLETE: Guest added to meal`);
      addLog(`📝 Database response: ${JSON.stringify(dbData)}`);

      // STEP 2: Call smart contract with meal ID (joinMeal function)
      addLog('⏳ STEP 2: Calling smart contract to confirm participation...');
      
      const username = session?.user?.username;
      if (!username) {
        throw new Error('No username in session');
      }
      
      addLog(`Getting wallet address from MiniKit for: ${username}`);
      const userDetails = await (MiniKit as any).getUserByUsername(username);
      const walletAddress = userDetails?.walletAddress;
      
      if (!walletAddress) {
        throw new Error('Could not get wallet address from MiniKit');
      }

      addLog(`Got wallet: ${walletAddress}`);

      // Prepare Permit2 structure for guest
      const permitTransfer = {
        permitted: { token: WLD, amount: FEE },
        nonce: Date.now().toString(),
        deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(),
      };

      addLog('Sending joinMeal() to smart contract...');
      addLog(`Meal ID: ${joinData.mealId}`);

      // Call smart contract joinMeal function
      addLog('⏳ Calling smart contract...');
      console.log('[TRANSACTION] About to call joinMeal sendTransaction');
      
      const rawResponse = await (MiniKit as any).sendTransaction({
        transaction: [
          {
            address: MEALMESH_CONTRACT,
            abi: MealMeshABI,
            functionName: 'joinMeal',
            args: [
              joinData.mealId,  // ✅ Meal ID
              [
                [permitTransfer.permitted.token, permitTransfer.permitted.amount],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              [PLATFORM, FEE],
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
        ],
        permit2: [
          {
            permitted: { token: WLD, amount: FEE },
            nonce: permitTransfer.nonce,
            deadline: permitTransfer.deadline,
            spender: MEALMESH_CONTRACT,
          },
        ],
      });

      addLog(`📊 RAW: ${JSON.stringify(rawResponse)}`);
      console.log('[TRANSACTION] RAW RESPONSE:', rawResponse);

      // The response structure is: { executedWith, data: { status, transactionId, transaction_id, ... } }
      const data = rawResponse?.data;
      const status = data?.status;
      const txId = data?.transaction_id;

      addLog(`Status: ${status}, TxId: ${txId}`);

      if (status === 'success' && txId) {
        addLog('✅ STEP 2 COMPLETE: Smart contract transaction successful!');
        addLog(`Transaction ID: ${txId}`);
        
        // STEP 3: Update database with transaction ID
        addLog('⏳ STEP 3: Updating database with transaction ID...');
        
        const updateResponse = await fetch(`/api/update-join/${joinData.mealId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: joinData.guestId,
            transactionId: txId,
          }),
        });

        addLog(`Update response status: ${updateResponse.status}`);
        const updateText = await updateResponse.text();
        addLog(`Update response text: ${updateText.substring(0, 200)}`);
        
        let updateData;
        try {
          updateData = JSON.parse(updateText);
        } catch (e) {
          throw new Error(`Failed to parse update response: ${updateText.substring(0, 200)}`);
        }
        
        if (updateData.success) {
          addLog('✅ STEP 3 COMPLETE: Join transaction recorded!');
          
          // STEP 4: Send chat message to host
          addLog('⏳ STEP 4: Sending notification chat to host...');
          
          try {
            if (MiniKit.isInstalled()) {
              addLog(`📱 Opening chat with host: ${joinData.hostUsername}`);
              
              // Open World profile chat link
              window.open(
                `https://world.org/profile?username=${joinData.hostUsername}&action=chat`,
                '_blank'
              );

              addLog('✅ STEP 4 COMPLETE: Chat window opened to host!');
              
              // Show success toast
              toast.success({
                title: '✅ Successfully Joined Meal!',
                description: `You've joined the meal at ${joinData.restaurant}. Chat window opened to host!`,
                duration: 4000,
              });
            } else {
              addLog('⚠️ STEP 4 WARNING: MiniKit not installed, skipping chat');
            }
          } catch (chatError) {
            console.error('[TRANSACTION] Chat error:', chatError);
            addLog('⚠️ STEP 4 WARNING: Chat error, but meal join was successful');
          }

          addLog('✅✅✅ ALL STEPS COMPLETE - SUCCESSFULLY JOINED MEAL! ✅✅✅');
          setButtonState('success');
          setTxHash(txId);
          
          if (onMealJoined) {
            onMealJoined(joinData.mealId);
          }
        } else {
          throw new Error(updateData.error || 'Failed to update join with transaction ID');
        }

      } else if (status === 'error') {
        addLog(`❌ STEP 2 FAILED: ${data?.error}`);
        setButtonState('failed');
        setDemoError(data?.error || 'Transaction failed');
        setTimeout(() => router.push('/?tab=browse'), 1000);

      } else {
        throw new Error(`Unexpected status: ${status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ERROR: ${errorMsg}`);
      setButtonState('failed');
      setDemoError(errorMsg);
    } finally {
      // Safety net — if somehow buttonState never updated
      setButtonState(prev => prev === 'pending' ? 'failed' : prev);
    }
  };

  // Listen for meal creation event from CreateMeal component
  useEffect(() => {
    const handleMealCreationEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[TRANSACTION] 📡 Received createMealTransaction event');
      const mealDataFromForm = customEvent.detail as MealData;
      console.log('[TRANSACTION] Meal data:', mealDataFromForm);
      handleCreateMealFromForm(mealDataFromForm);
    };

    const handleJoinMealEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[TRANSACTION] 📡 Received joinMealTransaction event');
      const joinData = customEvent.detail as JoinMealData;
      console.log('[TRANSACTION] Join data:', joinData);
      handleJoinMealFromBrowse(joinData);
    };

    window.addEventListener('createMealTransaction', handleMealCreationEvent);
    window.addEventListener('joinMealTransaction', handleJoinMealEvent);
    
    return () => {
      window.removeEventListener('createMealTransaction', handleMealCreationEvent);
      window.removeEventListener('joinMealTransaction', handleJoinMealEvent);
    };
  }, [session]);



  return (
    <div className="grid w-full gap-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
      {/* Success Message */}
      {buttonState === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold text-green-900 mb-2">✅ SUCCESS!</p>
          <p className="text-sm text-green-800 mb-1">Transaction ID:</p>
          <p className="text-xs font-mono text-green-700 break-all">{txHash}</p>
        </div>
      )}

      {/* Error Message */}
      {buttonState === 'failed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-900 mb-2">❌ ERROR!</p>
          <p className="text-sm text-red-800 break-all">{demoError || 'Smart contract call failed'}</p>
        </div>
      )}

      {/* Step Logs */}
      {stepLogs.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
          <p className="font-semibold text-gray-900 mb-3">📋 Process Steps:</p>
          <div className="space-y-2">
            {stepLogs.map((log, idx) => (
              <p key={idx} className="text-xs text-gray-700 font-mono">
                {log}
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-2">ℹ️ Two Ways to Create Meals:</p>
        <p className="text-xs mb-3 font-semibold">🎬 DEMO (Home Tab):</p>
        <p className="text-xs mb-2">1. Uses random meal ID (for testing)</p>
        <p className="text-xs mb-2">2. Uses fixed date (June 19, 2026)</p>
        <p className="text-xs mb-3">3. Tests smart contract directly</p>
        
        <p className="text-xs mb-3 font-semibold">🍽️ REAL (Create Tab):</p>
        <p className="text-xs mb-2">1. Fill form with real meal details</p>
        <p className="text-xs mb-2">2. Save to database → Get real mealId</p>
        <p className="text-xs mb-2">3. Call smart contract with real mealId</p>
        <p className="text-xs">4. Update database with transaction ID</p>
      </div>
    </div>
  );
};