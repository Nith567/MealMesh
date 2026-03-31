'use client';

import { useState } from 'react';
import { CreateMeal } from '@/components/CreateMeal';
import { BrowseMeals } from '@/components/BrowseMeals';

type Screen = 'browse' | 'create';

export const HomeScreen = ({ userId, username, address }: { userId: string; username: string; address?: string }) => {
  const [screen, setScreen] = useState<Screen>('browse');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
      {/* Content Area */}
      <div className="max-h-[calc(100vh-120px)] overflow-y-auto pb-24">
        {screen === 'browse' && <BrowseMeals userId={userId} username={username} />}
        {screen === 'create' && (
          <CreateMeal hostId={userId} hostUsername={username} hostAddress={address} />
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-300 flex gap-3 p-4 pb-8">
        <button
          onClick={() => setScreen('browse')}
          className={`flex-1 py-3 rounded-lg font-semibold text-center transition ${
            screen === 'browse'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          🌍 Browse
        </button>
        <button
          onClick={() => setScreen('create')}
          className={`flex-1 py-3 rounded-lg font-semibold text-center transition ${
            screen === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          🍽️ Create
        </button>
      </div>
    </div>
  );
};
