'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Chip,
  Select,
  Skeleton,
  SkeletonTypography,
  ListItem,
} from '@worldcoin/mini-apps-ui-kit-react';
import { VerifyButton } from '@/components/VerifyButton';

interface Meal {
  id: string;
  hostUsername: string;
  restaurant: string;
  city: string;
  country: string;
  date: string;
  time: string;
  cuisine: string;
  maxGuests: number;
  currentGuests: number;
  availableSeats: number;
  isFull: boolean;
  distance?: number;
  description?: string;
}

type BrowseMode = 'all' | 'nearby';
type SortOption = 'closest' | 'newest' | 'availability';

const CUISINE_OPTIONS = [
  { value: '__all__', label: '🌍 All Cuisines' },
  { value: 'Italian', label: '🇮🇹 Italian' },
  { value: 'Japanese', label: '🇯🇵 Japanese' },
  { value: 'Indian', label: '🇮🇳 Indian' },
  { value: 'Mexican', label: '🇲🇽 Mexican' },
  { value: 'Thai', label: '🇹🇭 Thai' },
  { value: 'Chinese', label: '🇨🇳 Chinese' },
  { value: 'French', label: '🇫🇷 French' },
  { value: 'American', label: '🇺🇸 American' },
  { value: 'Mediterranean', label: '🌊 Mediterranean' },
  { value: 'Korean', label: '🇰🇷 Korean' },
  { value: 'Vietnamese', label: '🇻🇳 Vietnamese' },
];

const SORT_OPTIONS = [
  { value: 'closest', label: 'Closest first' },
  { value: 'newest', label: 'Newest meals' },
  { value: 'availability', label: 'Most available' },
];

export const BrowseMeals = ({
  userId,
  username,
  verified,
}: {
  userId: string;
  username: string;
  verified?: boolean;
}) => {
  const [mode, setMode] = useState<BrowseMode>('all');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('closest');
  const [radiusKm, setRadiusKm] = useState(50);
  const [isVerified, setIsVerified] = useState(verified || false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => { fetchMeals(); }, [mode, selectedCuisine, radiusKm]);

  const fetchMeals = async () => {
    setLoading(true);
    setError('');

    try {
      if (mode === 'nearby') {
        if (!navigator.geolocation) throw new Error('Geolocation not supported');

        navigator.geolocation.getCurrentPosition(
          async ({ coords: { latitude, longitude } }) => {
            setUserLocation({ latitude, longitude });
            try {
              const params = new URLSearchParams({
                action: 'nearby',
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                radiusKm: radiusKm.toString(),
                ...(selectedCuisine && { cuisine: selectedCuisine }),
              });
              const res = await fetch(`/api/browse-meals?${params}`);
              const data = await res.json();
              if (data.success) {
                setMeals(data.meals);
                if (!data.meals.length) setError('No meals found within 50km. Try All Meals!');
              } else {
                setError(data.error || 'Failed to fetch meals');
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Error fetching nearby meals');
            } finally {
              setLoading(false);
            }
          },
          (e) => {
            const msg =
              e.code === e.PERMISSION_DENIED
                ? 'Location permission denied. Enable location or switch to All Meals.'
                : e.code === e.TIMEOUT
                ? 'Location request timed out. Try again.'
                : 'Location unavailable.';
            setError(msg);
            setLoading(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        const params = new URLSearchParams({
          action: 'all',
          ...(selectedCuisine && { cuisine: selectedCuisine }),
        });
        const res = await fetch(`/api/browse-meals?${params}`);
        const data = await res.json();
        if (data.success) setMeals(data.meals);
        else setError(data.error || 'Failed to fetch meals');
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error fetching meals');
      setLoading(false);
    }
  };

  const handleJoinMeal = (mealId: string, restaurant: string, hostUsername: string, date: string, time: string) => {
    window.dispatchEvent(new CustomEvent('joinMealTransaction', {
      detail: { mealId, guestUsername: username, guestId: userId, restaurant, hostUsername, date, time },
    }));
  };

  const displayMeals = [...meals].sort((a, b) => {
    if (mode === 'nearby') {
      if (sortBy === 'closest') return (a.distance ?? 999) - (b.distance ?? 999);
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'availability') return b.availableSeats - a.availableSeats;
    }
    return 0;
  });

  const fillPct = (m: Meal) => Math.min((m.currentGuests / m.maxGuests) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col pb-32">

      {/* ── Verify Banner ─────────────────────────────────────── */}
      {!isVerified && (
        <div
          className="mx-6 mt-6 rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'rgb(var(--info-100))', border: '1px solid rgb(var(--info-200))' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
              style={{ background: 'rgb(var(--info-200))' }}
            >
              🌐
            </div>
            <div className="flex flex-col gap-0.5">
              <Typography variant="label" level={2} className="text-info-700">
                World ID required
              </Typography>
              <Typography variant="body" level={4} className="text-info-700" style={{ opacity: 0.75 }}>
                Verify once to join any meal
              </Typography>
            </div>
          </div>
          <VerifyButton onVerificationSuccess={() => setIsVerified(true)} />
        </div>
      )}

      {/* ── Mode Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-2 px-5 py-4 mt-6">
        {(['all', 'nearby'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 rounded-xl py-1.5 transition-all active:scale-[0.97]"
            style={{
              background: mode === m ? 'rgb(var(--gray-900))' : 'rgb(var(--gray-100))',
              color: mode === m ? 'rgb(var(--gray-0))' : 'rgb(var(--gray-500))',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
            }}
          >
            {m === 'all' ? '🌍 All Meals' : '📍 Near Me'}
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex gap-3 px-6 mt-4">
        <div className="flex-1">
          <Select
            options={CUISINE_OPTIONS}
            value={selectedCuisine || '__all__'}
            onChange={(v) => setSelectedCuisine(v === '__all__' ? undefined : v)}
            placeholder="All Cuisines"
          />
        </div>
        {mode === 'nearby' && (
          <div className="flex-1">
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(v) => setSortBy(v as SortOption)}
              placeholder="Sort by"
            />
          </div>
        )}
      </div>

      {/* ── Radius Toggle (Near Me Mode) ──────────────────────── */}
      {mode === 'nearby' && (
        <div className="flex gap-2 px-6 mt-3">
          {[50, 100, 200].map((km) => (
            <button
              key={km}
              onClick={() => setRadiusKm(km)}
              className="flex-1 rounded-xl py-2 transition-all active:scale-[0.97]"
              style={{
                background: radiusKm === km ? 'rgb(var(--info-600))' : 'rgb(var(--gray-100))',
                color: radiusKm === km ? 'rgb(var(--gray-0))' : 'rgb(var(--gray-500))',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
              }}
            >
              {km}km
            </button>
          ))}
        </div>
      )}

      {/* ── Count bar ─────────────────────────────────────────── */}
      {!loading && meals.length > 0 && (
        <div className="px-6 mt-4">
          <Typography variant="body" level={4} className="text-gray-400">
            {meals.length} meal{meals.length !== 1 ? 's' : ''} found
            {selectedCuisine ? ` · ${selectedCuisine}` : ''}
            {mode === 'nearby' ? ` · within ${radiusKm}km` : ''}
          </Typography>
        </div>
      )}

      {/* ── Loading Skeletons ─────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-3 px-6 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgb(var(--gray-0))', border: '1px solid rgb(var(--gray-100))' }}
            >
              <SkeletonTypography variant="label" level={1} width="60%" />
              <SkeletonTypography variant="body" level={4} width="40%" />
              <Skeleton height={8} className="rounded-full" />
              <SkeletonTypography variant="body" level={4} width="30%" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && !loading && (
        <div
          className="mx-6 mt-6 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgb(var(--error-100))', border: '1px solid rgb(var(--error-200))' }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div className="flex flex-col gap-2 flex-1">
            <Typography variant="label" level={2} className="text-error-700">
              Could not load meals
            </Typography>
            <Typography variant="body" level={4} className="text-error-700" style={{ opacity: 0.8 }}>
              {error}
            </Typography>
            {mode === 'nearby' && (
              <button
                onClick={() => setMode('all')}
                style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgb(var(--error-600))', textAlign: 'left' }}
              >
                Switch to All Meals →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────── */}
      {!loading && meals.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center px-6 py-16 gap-4 text-center">
          <span className="text-5xl">🍽️</span>
          <div className="flex flex-col gap-1">
            <Typography variant="heading" level={3} className="text-gray-900">No meals found</Typography>
            <Typography variant="body" level={3} className="text-gray-400">
              {mode === 'nearby'
                ? 'No meals near your location. Try All Meals!'
                : selectedCuisine
                ? `No ${selectedCuisine} meals available yet.`
                : 'Be the first to create a meal!'}
            </Typography>
          </div>
          {mode === 'nearby' && (
            <Button variant="secondary" size="sm" onClick={() => setMode('all')}>
              View All Meals
            </Button>
          )}
        </div>
      )}

      {/* ── Meal Cards ────────────────────────────────────────── */}
      {!loading && displayMeals.length > 0 && (
        <div className="flex flex-col gap-3 px-6 mt-6">
          {displayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              mode={mode}
              isVerified={isVerified}
              fillPct={fillPct(meal)}
              onJoin={() => handleJoinMeal(meal.id, meal.restaurant, meal.hostUsername, meal.date, meal.time)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  mode,
  isVerified,
  fillPct,
  onJoin,
}: {
  meal: Meal;
  mode: BrowseMode;
  isVerified: boolean;
  fillPct: number;
  onJoin: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgb(var(--gray-0))',
        border: `1px solid ${meal.isFull ? 'rgb(var(--gray-100))' : 'rgb(var(--gray-200))'}`,
        boxShadow: meal.isFull ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
        opacity: meal.isFull ? 0.65 : 1,
      }}
    >
      {/* Card Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-start justify-between gap-3"
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <Typography variant="label" level={1} className="text-gray-900 truncate">
            {meal.restaurant}
          </Typography>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip variant="default" label={meal.cuisine} />
            {meal.isFull && <Chip variant="error" label="Full" />}
            {!meal.isFull && meal.availableSeats <= 2 && (
              <Chip variant="warning" label={`${meal.availableSeats} left`} />
            )}
          </div>
          {meal.description && (
            <Typography variant="body" level={4} className="text-gray-600 text-sm mt-2 line-clamp-2">
              {meal.description}
            </Typography>
          )}
        </div>

        {/* Distance badge */}
        {mode === 'nearby' && meal.distance != null && (
          <div
            className="flex flex-col items-center rounded-xl px-3 py-2 flex-shrink-0"
            style={{ background: 'rgb(var(--info-100))', border: '1px solid rgb(var(--info-200))' }}
          >
            <Typography variant="label" level={1} className="text-info-700">
              {meal.distance.toFixed(1)}
            </Typography>
            <span style={{ fontSize: '0.65rem', color: 'rgb(var(--info-700))', opacity: 0.75 }}>km</span>
          </div>
        )}
      </div>

      {/* Details via ListItem-style rows */}
      <div style={{ borderTop: '1px solid rgb(var(--gray-100))' }}>
        <ListItem
          label={`${meal.city}, ${meal.country}`}
          description={`${meal.date} · ${meal.time}`}
          startAdornment={<span className="text-base">📍</span>}
        />
<div style={{ borderTop: '1px solid rgb(var(--gray-50))' }}>
  <ListItem
    label={meal.hostUsername}
    description="Host"
    startAdornment={<span className="text-base">👨‍🍳</span>}
  />
</div>
      </div>

      {/* Capacity bar */}
      <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgb(var(--gray-100))' }}>
        <div className="flex justify-between items-center">
          <Typography variant="body" level={4} className="text-gray-400">
            Guests
          </Typography>
          <Typography variant="label" level={2} className="text-gray-700">
            {meal.currentGuests} / {meal.maxGuests}
          </Typography>
        </div>
        <div
          className="w-full rounded-full"
          style={{ height: 6, background: 'rgb(var(--gray-100))' }}
        >
          <div
            className="rounded-full transition-all"
            style={{
              width: `${fillPct}%`,
              height: 6,
              background: meal.isFull
                ? 'rgb(var(--error-600))'
                : fillPct > 75
                ? 'rgb(var(--warning-600))'
                : 'rgb(var(--success-600))',
            }}
          />
        </div>
        <Typography variant="body" level={4} className="text-gray-400">
          💰 0.001 WLD platform fee
        </Typography>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        {!isVerified ? (
          <div
            className="rounded-xl px-4 py-3 text-center"
            style={{ background: 'rgb(var(--info-100))', border: '1px solid rgb(var(--info-200))' }}
          >
            <Typography variant="body" level={4} className="text-info-700">
              Verify with World ID to join
            </Typography>
          </div>
        ) : (
          <Button
            onClick={onJoin}
            disabled={meal.isFull}
            size="lg"
            variant={meal.isFull ? 'tertiary' : 'primary'}
            fullWidth
          >
            {meal.isFull ? 'Meal Full' : 'Join Meal'}
          </Button>
        )}
      </div>
    </div>
  );
}