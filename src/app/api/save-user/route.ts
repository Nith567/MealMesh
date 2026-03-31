import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SaveUserPayload {
  username: string;
  worldIdNullifier: string;
  address?: string;
}

/**
 * Save verified World ID user to database
 * Called after successful World ID verification
 */
export async function POST(req: NextRequest) {
  console.log('[SAVE-USER] POST request received');

  try {
    const body = (await req.json()) as SaveUserPayload;
    console.log('[SAVE-USER] Request body:', body);

    const { username, worldIdNullifier, address } = body;

    if (!username || !worldIdNullifier) {
      console.error('[SAVE-USER] Missing required fields: username or worldIdNullifier');
      return NextResponse.json(
        { error: 'Username and worldIdNullifier are required' },
        { status: 400 }
      );
    }

    // Check if user already exists by worldIdNullifier
    const { data: existingUser, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .eq('worldIdNullifier', worldIdNullifier)
      .single();

    if (existingUser) {
      console.log('[SAVE-USER] User already exists:', existingUser.username);
      return NextResponse.json({
        success: true,
        user: existingUser,
        isNew: false,
      });
    }

    // Create new user with username as ID
    console.log('[SAVE-USER] Creating new user:', username);
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert([
        {
          id: username, // Use username as unique ID
          username,
          worldIdNullifier,
          address: address || null,
          verified: true,
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('[SAVE-USER] ✅ User saved successfully:', newUser);
    return NextResponse.json({
      success: true,
      user: newUser,
      isNew: true,
    });
  } catch (error) {
    console.error('[SAVE-USER] Error:', error);
    console.error('[SAVE-USER] Error message:', error instanceof Error ? error.message : 'Unknown error');

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save user' },
      { status: 500 }
    );
  }
}
