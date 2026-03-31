import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createId } from '@paralleldrive/cuid2';

interface CreateMealPayload {
  hostId: string;
  hostUsername: string;
  hostAddress?: string;
  restaurant: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  cuisine: string;
  description?: string;
  maxGuests: number;
  contractMealId?: string;
  transactionId?: string;
}

/**
 * Create a new meal
 * Called after host fills meal creation form and completes smart contract interaction
 */
export async function POST(req: NextRequest) {
  console.log('[CREATE-MEAL] POST request received');

  try {
    const body = (await req.json()) as CreateMealPayload;
    console.log('[CREATE-MEAL] Request body:', body);

    const {
      hostId,
      hostUsername,
      hostAddress,
      restaurant,
      city,
      country,
      latitude,
      longitude,
      date,
      time,
      cuisine,
      description,
      maxGuests,
      contractMealId,
      transactionId,
    } = body;

    // Validate required fields
    if (!hostId || !hostUsername || !restaurant || !city || !country || !date || !time || !cuisine || !maxGuests) {
      console.error('[CREATE-MEAL] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: hostId, hostUsername, restaurant, city, country, date, time, cuisine, maxGuests' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.error('[CREATE-MEAL] Invalid location data');
      return NextResponse.json(
        { error: 'latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    // Verify that user is World ID verified
    console.log('[CREATE-MEAL] Checking user verification status...');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, verified')
      .eq('username', hostId)
      .single();

    if (userError || !user) {
      console.error('[CREATE-MEAL] User not found:', hostId);
      return NextResponse.json(
        { error: 'User not found. Please verify your World ID first.' },
        { status: 404 }
      );
    }

    if (!user.verified) {
      console.error('[CREATE-MEAL] User not verified:', hostId);
      return NextResponse.json(
        { error: 'You must verify with World ID before creating a meal. Please complete verification first.' },
        { status: 403 }
      );
    }

    console.log('[CREATE-MEAL] ✅ User verified. Proceeding with meal creation...');
    console.log('[CREATE-MEAL] User ID from database:', user.id);

    // Create meal
    console.log('[CREATE-MEAL] Creating meal:', restaurant);
    const mealId = createId();
    
    const { data: newMeal, error: createError } = await supabase
      .from('Meal')
      .insert([
        {
          id: mealId,
          hostId: user.id, // Use the actual user ID from database, not username
          hostUsername,
          hostAddress: hostAddress || null,
          restaurant,
          city,
          country,
          latitude,
          longitude,
          locationString: `${city}, ${country}`,
          date,
          time,
          cuisine,
          description: description || null,
          maxGuests,
          currentGuests: 0, // Host doesn't count as guest
          stakeAmount: 0, // No stake required
          contractMealId: contractMealId || null,
          transactionId: transactionId || null,
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create meal: ${createError.message}`);
    }

    console.log('[CREATE-MEAL] ✅ Meal created successfully:', newMeal.id);
    return NextResponse.json({
      success: true,
      meal: newMeal,
      message: `Meal at ${restaurant} created successfully!`,
    });
  } catch (error) {
    console.error('[CREATE-MEAL] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create meal' },
      { status: 500 }
    );
  }
}
