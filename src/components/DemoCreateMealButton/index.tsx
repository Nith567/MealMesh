'use client';

import { useState } from 'react';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';

interface DemoMeal {
  date: number;
  date_str?: string;
  time_str?: string;
  city?: string;
  country?: string;
  restaurant?: string;
  latitude?: number;
  longitude?: number;
  cuisine?: string;
  description?: string;
  maxGuests?: number;
  hostId?: string;
  hostUsername?: string;
  hostAddress?: string;
}

export const DemoCreateMealButton = () => {
  const [mealId, setMealId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundMeal, setFoundMeal] = useState<DemoMeal | null>(null);

  const handleDemoClick = async () => {
    if (!mealId.trim()) {
      setError('Please enter a meal ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[DEMO] Fetching meal with ID:', mealId);

      // Fetch the meal from database
      const response = await fetch(`/api/get-meal/${mealId}`);
      const data = await response.json();

      if (!data.success || !data.meal) {
        setError(data.error || 'Meal not found');
        setFoundMeal(null);
        setLoading(false);
        return;
      }

      const meal = data.meal;
      console.log('[DEMO] ✅ Meal found:', meal);
      setFoundMeal(meal);

      // Prepare meal data for contract
      const mealDataForContract: DemoMeal = {
        date: typeof meal.date === 'string' ? Math.floor(new Date(meal.date).getTime() / 1000) : meal.date,
        date_str: meal.date,
        time_str: meal.time || '',
        restaurant: meal.restaurant,
        city: meal.city,
        country: meal.country,
        latitude: meal.latitude,
        longitude: meal.longitude,
        cuisine: meal.cuisine,
        description: meal.description,
        maxGuests: meal.maxGuests,
        hostId: meal.hostId,
        hostUsername: meal.hostUsername,
        hostAddress: meal.hostAddress,
      };

      console.log('[DEMO] Dispatching createMealTransaction event with meal data:', mealDataForContract);

      // Dispatch event to trigger Transaction component
      window.dispatchEvent(new CustomEvent('createMealTransaction', { detail: mealDataForContract }));

      console.log('[DEMO] ✅ Event dispatched! Check console for transaction details...');
      
    } catch (err) {
      console.error('[DEMO] Error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg mb-6">
      <p className="font-bold text-yellow-900 mb-3">🧪 DEMO: Test Smart Contract Interaction</p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-yellow-800 mb-1">Meal ID from Database:</label>
          <input
            type="text"
            value={mealId}
            onChange={(e) => {
              setMealId(e.target.value);
              setError('');
            }}
            placeholder="Enter existing meal ID"
            className="w-full px-3 py-2 border border-yellow-300 rounded text-sm"
          />
        </div>

        <Button
          onClick={handleDemoClick}
          disabled={loading || !mealId.trim()}
          size="lg"
          variant="primary"
          className="w-full bg-yellow-600 hover:bg-yellow-700"
        >
          {loading ? '⏳ Loading...' : '🧪 Test Contract (Auto-Trigger)'}
        </Button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {foundMeal && (
          <div className="p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
            <p className="font-bold">✅ Meal Found & Event Dispatched!</p>
            <p className="text-xs mt-1">Restaurant: {foundMeal.restaurant}</p>
            <p className="text-xs">Location: {foundMeal.city}, {foundMeal.country}</p>
            <p className="text-xs">Host: {foundMeal.hostUsername}</p>
            <p className="text-xs mt-2 text-gray-600">Check browser console for transaction logs...</p>
          </div>
        )}
      </div>
    </div>
  );
};
