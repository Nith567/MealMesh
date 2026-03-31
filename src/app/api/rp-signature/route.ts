import { signRequest } from "@worldcoin/idkit-core/signing";
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SIGNING_KEY = process.env.RP_SIGNING_KEY || '0xd378ba354ed49b2a559b9881066f256c6d1c9ef83b20d5417a6941cf3a404642';
const RP_ID = process.env.NEXT_PUBLIC_APP_ID ?? 'rp_5abdd0ac49824df6';

export async function POST(req: Request) {
  console.log('[RP-SIGNATURE] POST request received');
  
  if (!SIGNING_KEY) {
    console.error('[RP-SIGNATURE] SIGNING_KEY not configured');
    return NextResponse.json(
      { error: 'RP_SIGNING_KEY not configured' },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    console.log('[RP-SIGNATURE] Request body:', body);
    
    const { action } = body;
    console.log('[RP-SIGNATURE] Action:', action);
    
    if (!action) {
      console.error('[RP-SIGNATURE] Action is missing from request');
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 },
      );
    }

    console.log('[RP-SIGNATURE] Signing request with action:', action);
    const sig = signRequest(action, SIGNING_KEY);
    console.log('[RP-SIGNATURE] Signature generated:', sig);

    const response = {
      rp_id: RP_ID,
      sig: sig.sig,
      nonce: sig.nonce,
      created_at: Number(sig.createdAt),
      expires_at: Number(sig.expiresAt),
    };
    
    console.log('[RP-SIGNATURE] Response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[RP-SIGNATURE] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    );
  }
}