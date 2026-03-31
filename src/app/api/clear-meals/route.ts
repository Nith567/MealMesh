import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Clear all meals and guests from the database (for testing only)
 */
export async function DELETE(req: NextRequest) {
  console.log('[CLEAR-MEALS] DELETE request received');

  try {
    // Delete all guests first (foreign key constraint)
    console.log('[CLEAR-MEALS] Deleting all guests...');
    const { data: deletedGuests, error: guestError } = await supabase
      .from('Guest')
      .delete()
      .neq('id', ''); // This deletes all rows

    if (guestError) {
      console.error('[CLEAR-MEALS] Error deleting guests:', guestError);
      return NextResponse.json(
        { error: 'Failed to delete guests', details: guestError.message },
        { status: 400 }
      );
    }

    console.log('[CLEAR-MEALS] ✅ All guests deleted');

    // Delete all meals
    console.log('[CLEAR-MEALS] Deleting all meals...');
    const { data: deletedMeals, error: mealError } = await supabase
      .from('Meal')
      .delete()
      .neq('id', ''); // This deletes all rows

    if (mealError) {
      console.error('[CLEAR-MEALS] Error deleting meals:', mealError);
      return NextResponse.json(
        { error: 'Failed to delete meals', details: mealError.message },
        { status: 400 }
      );
    }

    console.log('[CLEAR-MEALS] ✅ All meals deleted');

    return NextResponse.json(
      { 
        success: true, 
        message: 'Database cleared successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CLEAR-MEALS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
