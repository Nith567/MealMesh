import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Get user by username - for debugging
 */
export async function POST(req: NextRequest) {
  console.log('[GET-USER] POST request received');

  try {
    const body = await req.json();
    const { username } = body;

    if (!username) {
      console.error('[GET-USER] Missing username');
      return NextResponse.json(
        { error: 'username is required' },
        { status: 400 }
      );
    }

    // Get user by username
    console.log('[GET-USER] Fetching user by username:', username);
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      console.log('[GET-USER] User not found:', username);
      return NextResponse.json({
        found: false,
        message: 'User not found',
      });
    }

    console.log('[GET-USER] User found:', user);
    return NextResponse.json({
      found: true,
      user,
    });
  } catch (error) {
    console.error('[GET-USER] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get user' },
      { status: 500 }
    );
  }
}
