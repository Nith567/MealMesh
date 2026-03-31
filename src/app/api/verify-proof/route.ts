import { NextRequest, NextResponse } from 'next/server';

interface IRequestPayload {
  payload: {
    protocol_version: string;
    nonce: string;
    action: string;
    responses: Array<{
      merkle_root: string;
      nullifier: string;
      proof: string;
      verification_level: string;
    }>;
    environment: string;
  };
  action: string;
  signal: string | undefined;
}

interface IVerifyResponse {
  success: boolean;
  [key: string]: unknown;
}

/**
 * This route is used to verify the proof of the user
 * It is critical proofs are verified from the server side
 * Read More: https://docs.world.org/world-id/verify-api
 */
export async function POST(req: NextRequest) {
  console.log('[VERIFY-PROOF] POST request received');
  
  try {
    const body = await req.json() as IRequestPayload;
    console.log('[VERIFY-PROOF] Request body:', JSON.stringify(body, null, 2));
    
    const { payload, action, signal } = body;

    const app_id = process.env.NEXT_PUBLIC_APP_ID as `rp_${string}`;
    console.log('[VERIFY-PROOF] App ID:', app_id);
    console.log('[VERIFY-PROOF] Action:', action);

    if (!payload) {
      console.error('[VERIFY-PROOF] Payload is missing');
      return NextResponse.json(
        { error: 'Invalid payload: payload is missing' },
        { status: 400 }
      );
    }

    if (!payload.responses || payload.responses.length === 0) {
      console.error('[VERIFY-PROOF] Responses array is missing or empty');
      return NextResponse.json(
        { error: 'Invalid payload: missing responses' },
        { status: 400 }
      );
    }

    // Get the first response from the array
    const proofResponse = payload.responses[0];
    console.log('[VERIFY-PROOF] Proof response:', JSON.stringify(proofResponse, null, 2));

    // For World ID 4.0, send the full payload directly
    const verifyUrl = `https://developer.worldcoin.org/api/v4/verify/${app_id}`;
    console.log('[VERIFY-PROOF] Sending verification request to:', verifyUrl);
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('[VERIFY-PROOF] Response status:', response.status);
    console.log('[VERIFY-PROOF] Response headers:', Object.fromEntries(response.headers));

    const verifyRes = (await response.json()) as IVerifyResponse;
    console.log('[VERIFY-PROOF] Verification response:', JSON.stringify(verifyRes, null, 2));

    if (verifyRes.success) {
      console.log("✅ [VERIFY-PROOF] User verified successfully");
      return NextResponse.json({ verifyRes, status: 200 });
    } else {
      console.log("❌ [VERIFY-PROOF] Verification failed:", JSON.stringify(verifyRes, null, 2));
      return NextResponse.json({ verifyRes, status: 400 });
    }
  } catch (error) {
    console.error('[VERIFY-PROOF] Error caught:', error);
    console.error('[VERIFY-PROOF] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[VERIFY-PROOF] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}