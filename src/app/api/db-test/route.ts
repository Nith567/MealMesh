import { supabase } from '@/lib/supabase'
import { createId } from '@paralleldrive/cuid2'

export async function GET(req: Request) {
  try {
    console.log('[DB-TEST] Testing Supabase connection...');

    // Test 1: Create a test user
    const testId = createId();
    const testUsername = `test_user_${Date.now()}`;
    const testNullifier = `test_nullifier_${Date.now()}`;

    const { data: createdUser, error: createError } = await supabase
      .from('User')
      .insert([
        {
          id: testId,
          username: testUsername,
          worldIdNullifier: testNullifier,
          verified: true,
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('[DB-TEST] ✅ Created test user:', createdUser);

    // Test 2: Query the user back
    const { data: fetchedUser, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .eq('id', createdUser.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch user: ${fetchError.message}`);
    }

    console.log('[DB-TEST] ✅ Fetched test user:', fetchedUser);

    // Test 3: Delete test user
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', createdUser.id);

    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log('[DB-TEST] ✅ Deleted test user');

    return Response.json({
      success: true,
      message: 'Supabase connection successful! ✅',
      testUser: createdUser.id,
    });
  } catch (error) {
    console.error('[DB-TEST] Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
