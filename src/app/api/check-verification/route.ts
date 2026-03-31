import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Check if a user is verified with World ID
 */
export async function POST(req: NextRequest) {
  console.log('[CHECK-VERIFICATION] POST request received');

  try {
    const body = await req.json();
    const { username } = body;

    if (!username) {
      console.error('[CHECK-VERIFICATION] Missing username');
      return NextResponse.json(
        { error: 'username is required' },
        { status: 400 }
      );
    }

    // Check user verification status in database
    console.log('[CHECK-VERIFICATION] Checking verification for user:', username);
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, username, verified')
      .eq('id', username)
      .single();

    if (userError || !user) {
      console.log('[CHECK-VERIFICATION] User not found in database:', username);
      return NextResponse.json({
        verified: false,
        message: 'User not found in database',
      });
    }

    console.log('[CHECK-VERIFICATION] User found:', user.username, 'Verified:', user.verified);
    return NextResponse.json({
      verified: user.verified || false,
      username: user.username,
      message: user.verified ? 'User is verified' : 'User is not verified',
    });
  } catch (error) {
    console.error('[CHECK-VERIFICATION] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check verification' },
      { status: 500 }
    );
  }
}
