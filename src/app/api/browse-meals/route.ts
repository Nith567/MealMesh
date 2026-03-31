import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface BrowseMealsQuery {
  action: 'all' | 'nearby'; // 'all' for all meals, 'nearby' for distance-based
  latitude?: number;
  longitude?: number;
  radiusKm?: number; // Default 50km
  cuisine?: string; // Optional filter
  city?: string; // Optional filter
  date?: string; // Optional filter
  limit?: number;
}

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Browse meals - get all meals or nearby meals based on user location
 */
export async function GET(req: NextRequest) {
  console.log('[BROWSE-MEALS] GET request received');

  try {
    const { searchParams } = new URL(req.url);
    const action = (searchParams.get('action') as 'all' | 'nearby') || 'all';
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined;
    const radiusKm = searchParams.get('radiusKm') ? parseFloat(searchParams.get('radiusKm')!) : 50;
    const cuisine = searchParams.get('cuisine') || undefined;
    const city = searchParams.get('city') || undefined;
    const dateFilter = searchParams.get('date') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    console.log('[BROWSE-MEALS] Query params:', { action, latitude, longitude, radiusKm, cuisine, city, dateFilter });

    // Start with base query
    let query = supabase.from('Meal').select('*').limit(limit);

    // Apply filters
    if (cuisine) {
      query = query.eq('cuisine', cuisine);
    }
    if (city) {
      query = query.eq('city', city);
    }
    if (dateFilter) {
      query = query.eq('date', dateFilter);
    }

    // Get meals from database
    const { data: meals, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch meals: ${fetchError.message}`);
    }

    if (!meals || meals.length === 0) {
      console.log('[BROWSE-MEALS] No meals found');
      return NextResponse.json({
        success: true,
        meals: [],
        total: 0,
        message: 'No meals found matching your criteria',
      });
    }

    // Filter by distance if action is 'nearby'
    let filteredMeals = meals;
    if (action === 'nearby' && latitude !== undefined && longitude !== undefined) {
      console.log('[BROWSE-MEALS] Filtering by distance - radius:', radiusKm, 'km');
      filteredMeals = meals
        .map((meal: any) => ({
          ...meal,
          distance: calculateDistance(latitude, longitude, meal.latitude, meal.longitude),
        }))
        .filter((meal: any) => meal.distance <= radiusKm)
        .sort((a: any, b: any) => a.distance - b.distance);

      console.log('[BROWSE-MEALS] Found', filteredMeals.length, 'meals within', radiusKm, 'km');
    } else if (action === 'all') {
      console.log('[BROWSE-MEALS] Returning all meals');
    }

    // Add availability status
    const mealsWithStatus = filteredMeals.map((meal: any) => ({
      ...meal,
      availableSeats: Math.max(0, meal.maxGuests - (meal.currentGuests || 0)),
      isFull: (meal.currentGuests || 0) >= meal.maxGuests,
    }));

    console.log('[BROWSE-MEALS] ✅ Returning', mealsWithStatus.length, 'meals');
    return NextResponse.json({
      success: true,
      meals: mealsWithStatus,
      total: mealsWithStatus.length,
      action,
      ...(action === 'nearby' && { radius: radiusKm, userLocation: { latitude, longitude } }),
    });
  } catch (error) {
    console.error('[BROWSE-MEALS] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for searching meals with body parameters
 * Useful for POST requests with more complex filters
 */
export async function POST(req: NextRequest) {
  console.log('[BROWSE-MEALS] POST request received');

  try {
    const body = (await req.json()) as BrowseMealsQuery;
    console.log('[BROWSE-MEALS] Request body:', body);

    const {
      action = 'all',
      latitude,
      longitude,
      radiusKm = 50,
      cuisine,
      city,
      date: dateFilter,
      limit = 100,
    } = body;

    // Validate location data for nearby search
    if (action === 'nearby' && (latitude === undefined || longitude === undefined)) {
      return NextResponse.json(
        { error: 'latitude and longitude are required for nearby search' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase.from('Meal').select('*').limit(limit);

    if (cuisine) {
      query = query.eq('cuisine', cuisine);
    }
    if (city) {
      query = query.eq('city', city);
    }
    if (dateFilter) {
      query = query.eq('date', dateFilter);
    }

    const { data: meals, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch meals: ${fetchError.message}`);
    }

    if (!meals || meals.length === 0) {
      return NextResponse.json({
        success: true,
        meals: [],
        total: 0,
        message: 'No meals found',
      });
    }

    // Filter by distance if nearby
    let filteredMeals = meals;
    if (action === 'nearby' && latitude !== undefined && longitude !== undefined) {
      filteredMeals = meals
        .map((meal: any) => ({
          ...meal,
          distance: calculateDistance(latitude, longitude, meal.latitude, meal.longitude),
        }))
        .filter((meal: any) => meal.distance <= radiusKm)
        .sort((a: any, b: any) => a.distance - b.distance);
    }

    // Add availability status
    const mealsWithStatus = filteredMeals.map((meal: any) => ({
      ...meal,
      availableSeats: Math.max(0, meal.maxGuests - (meal.currentGuests || 0)),
      isFull: (meal.currentGuests || 0) >= meal.maxGuests,
      distance: (meal as any).distance || undefined,
    }));

    console.log('[BROWSE-MEALS] ✅ Returning', mealsWithStatus.length, 'meals');
    return NextResponse.json({
      success: true,
      meals: mealsWithStatus,
      total: mealsWithStatus.length,
      action,
      ...(action === 'nearby' && { radius: radiusKm, userLocation: { latitude, longitude } }),
    });
  } catch (error) {
    console.error('[BROWSE-MEALS] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}
