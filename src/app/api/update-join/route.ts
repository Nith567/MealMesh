import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface UpdateJoinPayload {
  guestId: string;
  transactionId: string;
  mealId: string;
}

/**
 * Update a guest's join transaction ID after smart contract confirmation
 */
export async function PATCH(req: NextRequest) {
  console.log('[UPDATE-JOIN] PATCH request received');

  try {
    const body = (await req.json()) as UpdateJoinPayload;
    console.log('[UPDATE-JOIN] Request body:', body);

    const { guestId, transactionId, mealId } = body;

    if (!guestId || !transactionId || !mealId) {
      console.error('[UPDATE-JOIN] Missing required fields');
      return NextResponse.json(
        { error: 'guestId, transactionId, and mealId are required' },
        { status: 400 }
      );
    }

    console.log(`[UPDATE-JOIN] Updating guest ${guestId} in meal ${mealId} with transaction ID: ${transactionId}`);

    // Update the guest's transaction ID
    const { data: guest, error: updateError } = await supabase
      .from('Guest')
      .update({ transactionId: transactionId })
      .eq('userId', guestId)
      .eq('mealId', mealId)
      .select()
      .single();

    if (updateError) {
      console.error('[UPDATE-JOIN] Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    console.log('[UPDATE-JOIN] ✅ Guest join updated with transaction ID');

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error('[UPDATE-JOIN] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
