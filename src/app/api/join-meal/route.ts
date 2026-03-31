import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createId } from '@paralleldrive/cuid2';

// Note: Chat notifications will be handled on client side with MiniKit

interface JoinMealPayload {
  mealId: string;
  userId: string;
  username: string;
  userAddress?: string;
  transactionId: string; // From Permit2 payment
}

/**
 * Join a meal - saves guest to database and sends chat to host + previous guests
 */
export async function POST(req: NextRequest) {
  console.log('[JOIN-MEAL] POST request received');

  try {
    const body = (await req.json()) as JoinMealPayload;
    console.log('[JOIN-MEAL] Request body:', body);

    const { mealId, userId, username, userAddress, transactionId } = body;

    if (!mealId || !userId || !username || !transactionId) {
      console.error('[JOIN-MEAL] Missing required fields');
      return NextResponse.json(
        { error: 'mealId, userId, username, and transactionId are required' },
        { status: 400 }
      );
    }

    // Get the meal details
    console.log('[JOIN-MEAL] Fetching meal:', mealId);
    const { data: meal, error: mealError } = await supabase
      .from('Meal')
      .select('*')
      .eq('id', mealId)
      .single();

    if (mealError || !meal) {
      console.error('[JOIN-MEAL] Meal not found:', mealId);
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Check if meal is full
    if (meal.currentGuests >= meal.maxGuests) {
      console.error('[JOIN-MEAL] Meal is full:', mealId);
      return NextResponse.json(
        { error: 'Meal is full' },
        { status: 400 }
      );
    }

    // Verify that user is World ID verified
    console.log('[JOIN-MEAL] Checking user verification status...');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, verified')
      .eq('username', userId)
      .single();

    if (userError || !user) {
      console.error('[JOIN-MEAL] User not found:', userId);
      return NextResponse.json(
        { error: 'User not found. Please verify your World ID first.' },
        { status: 404 }
      );
    }

    if (!user.verified) {
      console.error('[JOIN-MEAL] User not verified:', userId);
      return NextResponse.json(
        { error: 'You must verify with World ID before joining a meal. Please complete verification first.' },
        { status: 403 }
      );
    }

    console.log('[JOIN-MEAL] ✅ User verified. Proceeding with join...');

    // Check if user already joined (DISABLED FOR TESTING - allow multiple joins from same user)
    // const { data: existingGuest } = await supabase
    //   .from('Guest')
    //   .select('*')
    //   .eq('mealId', mealId)
    //   .eq('userId', user.id)
    //   .single();

    // if (existingGuest) {
    //   console.error('[JOIN-MEAL] User already joined this meal:', mealId);
    //   return NextResponse.json(
    //     { error: 'You have already joined this meal' },
    //     { status: 409 }
    //   );
    // }

    // Create guest entry
    console.log('[JOIN-MEAL] Creating guest entry for user:', username);
    const { data: guest, error: guestError } = await supabase
      .from('Guest')
      .insert([
        {
          id: createId(),
          mealId,
          userId: user.id, // Use the actual user ID from database, not username
          username,
          userAddress: userAddress || null,
          transactionId,
          joinedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (guestError) {
      throw new Error(`Failed to create guest: ${guestError.message}`);
    }

    // Update meal guest count
    console.log('[JOIN-MEAL] Updating meal guest count');
    const { data: updatedMeal, error: updateError } = await supabase
      .from('Meal')
      .update({ currentGuests: meal.currentGuests + 1 })
      .eq('id', mealId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update meal: ${updateError.message}`);
    }

    console.log('[JOIN-MEAL] Guest created successfully:', guest);

    // Fetch previous guests to get their contact info for chat
    const { data: previousGuests } = await supabase
      .from('Guest')
      .select('username, userAddress')
      .eq('mealId', mealId)
      .neq('id', guest.id); // Exclude the guest we just created

    // Prepare chat recipients
    const chatRecipients: Set<string> = new Set();

    // Add host (prefer username, fallback to address)
    if (updatedMeal?.hostUsername) {
      chatRecipients.add(updatedMeal.hostUsername);
    } else if (updatedMeal?.hostAddress) {
      chatRecipients.add(updatedMeal.hostAddress);
    }

    // Add previous guests (prefer username, fallback to address)
    previousGuests?.forEach((g: any) => {
      if (g.username) {
        chatRecipients.add(g.username);
      } else if (g.userAddress) {
        chatRecipients.add(g.userAddress);
      }
    });

    const uniqueRecipients = Array.from(chatRecipients);

    console.log('[JOIN-MEAL] Chat recipients:', uniqueRecipients);

    // Note: Chat notifications are sent on client side via MiniKit
    // This API just handles the database operations
    
    return NextResponse.json({
      success: true,
      guest,
      meal: updatedMeal,
      chatRecipients: uniqueRecipients,
      message: `Successfully joined ${updatedMeal?.restaurant}!`,
    });
  } catch (error) {
    console.error('[JOIN-MEAL] Error:', error);
    console.error('[JOIN-MEAL] Error message:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join meal' },
      { status: 500 }
    );
  }
}
