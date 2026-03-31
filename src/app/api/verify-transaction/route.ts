import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify transaction status using World's userOpHash
 * Polls the World developer API to confirm transaction completion
 */
export async function POST(req: NextRequest) {
  console.log('[VERIFY-TX] POST request received');

  try {
    const body = await req.json() as { userOpHash: string };
    const { userOpHash } = body;

    if (!userOpHash) {
      console.error('[VERIFY-TX] Missing userOpHash');
      return NextResponse.json(
        { error: 'userOpHash is required' },
        { status: 400 }
      );
    }

    console.log('[VERIFY-TX] Verifying transaction:', userOpHash);

    // Poll the World developer API with retry logic
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(
          `https://developer.world.org/api/v2/minikit/userop/${userOpHash}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const status = await response.json();
        console.log(`[VERIFY-TX] Attempt ${i + 1}: Status response:`, status);

        if (status.status === 'success') {
          console.log('[VERIFY-TX] ✅ Transaction confirmed!');
          console.log('[VERIFY-TX] Transaction hash:', status.transaction_hash);
          console.log('[VERIFY-TX] Sender:', status.sender);
          
          return NextResponse.json({
            success: true,
            status: 'confirmed',
            transactionHash: status.transaction_hash,
            sender: status.sender,
            userOpHash: userOpHash,
          });
        } else if (status.status === 'failed') {
          console.log('[VERIFY-TX] ❌ Transaction failed!');
          return NextResponse.json({
            success: false,
            status: 'failed',
            error: 'Transaction failed on-chain',
            userOpHash: userOpHash,
          }, { status: 400 });
        }

        // Still pending, log and retry after 3 seconds
        console.log(`[VERIFY-TX] Attempt ${i + 1}: Still pending, retrying...`);
        if (i < 2) {
          await new Promise((r) => setTimeout(r, 3000)); // wait 3s before next attempt
        }
      } catch (fetchError) {
        console.error('[VERIFY-TX] Fetch error on attempt', i + 1, ':', fetchError);
        if (i < 2) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    // Timeout after 3 attempts
    console.log('[VERIFY-TX] ⏱️ Timed out waiting for transaction confirmation');
    return NextResponse.json({
      success: false,
      status: 'timeout',
      error: 'Transaction confirmation timed out. Please check your transaction status later.',
      userOpHash: userOpHash,
    }, { status: 408 });

  } catch (error) {
    console.error('[VERIFY-TX] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify transaction' },
      { status: 500 }
    );
  }
}
