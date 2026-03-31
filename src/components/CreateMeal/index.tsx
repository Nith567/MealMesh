'use client';

import { useState, useEffect } from 'react';
import { Button, Input, LiveFeedback, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { VerifyButton } from '@/components/VerifyButton';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useToast } from '@/components/Toast';

export const CreateMeal = ({ hostId, hostUsername, hostAddress, verified, onVerificationSuccess }: { hostId: string; hostUsername: string; hostAddress?: string; verified?: boolean; onVerificationSuccess?: () => void }) => {
  const { toast } = useToast();
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);
  const [locationState, setLocationState] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [location, setLocation] = useState({ city: '', country: '', latitude: 0, longitude: 0 });
  const [isVerified, setIsVerified] = useState(verified || false);
  const [formData, setFormData] = useState({
    restaurant: '',
    cuisine: '',
    date: '',
    time: '',
    description: '',
    maxGuests: '4',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMealCreated = (mealId: string) => {
    console.log('[CREATE-MEAL-CLIENT] 🎉 Meal created successfully:', mealId);
    setButtonState('success');
    
    // Show success toast
    toast.success({
      title: '✅ Meal Created Successfully!',
      description: `Your meal has been created...`,
      duration: 4000,
    });
    
    // Reset form after success
    setTimeout(() => {
      setFormData({
        restaurant: '',
        cuisine: '',
        date: '',
        time: '',
        description: '',
        maxGuests: '4',
      });
      setLocation({ city: '', country: '', latitude: 0, longitude: 0 });
      setButtonState(undefined);
      setErrors({});
    }, 2000);
  };

  // Listen for meal creation success event from Transaction component
  useEffect(() => {
    const handleMealCreatedSuccess = (event: any) => {
      const mealId = event.detail?.mealId;
      if (mealId) {
        handleMealCreated(mealId);
      }
    };

    window.addEventListener('mealCreatedSuccess', handleMealCreatedSuccess);
    
    return () => {
      window.removeEventListener('mealCreatedSuccess', handleMealCreatedSuccess);
    };
  }, []);

  const handleGetLocation = async () => {
    setLocationState('pending');
    try {
      console.log('[CREATE-MEAL-CLIENT] Getting user location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('[CREATE-MEAL-CLIENT] Location:', latitude, longitude);
          
          try {
            // Reverse geocode to get city/country
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown City';
            const country = data.address.country || 'Unknown Country';
            
            setLocation({
              city,
              country,
              latitude,
              longitude,
            });
            setLocationState('success');
            setTimeout(() => setLocationState('idle'), 3000);
          } catch (geocodeError) {
            console.log('[CREATE-MEAL-CLIENT] Geocoding error, using coordinates:', geocodeError);
            setLocation({
              city: 'Current Location',
              country: 'World',
              latitude,
              longitude,
            });
            setLocationState('success');
            setTimeout(() => setLocationState('idle'), 3000);
          }
        },
        (error) => {
          console.error('[CREATE-MEAL-CLIENT] Geolocation error:', error);
          setLocationState('failed');
          setTimeout(() => setLocationState('idle'), 3000);
        }
      );
    } catch (error) {
      console.error('[CREATE-MEAL-CLIENT] Location error:', error);
      setLocationState('failed');
      setTimeout(() => setLocationState('idle'), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isVerified) {
      return;
    }
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.restaurant.trim()) newErrors.restaurant = 'Restaurant name is required';
    if (!formData.cuisine) newErrors.cuisine = 'Cuisine type is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (parseInt(formData.maxGuests) < 2 || parseInt(formData.maxGuests) > 6) newErrors.maxGuests = 'Max guests must be between 2-6';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setButtonState('pending');

    try {
      console.log('[CREATE-MEAL-CLIENT] Form validated, fetching location...');
      console.log('[CREATE-MEAL-CLIENT] Form data:', formData);

      // STEP 1: Fetch location automatically if not already fetched
      let currentLocation = location;
      
      if (currentLocation.latitude === 0 && currentLocation.longitude === 0) {
        console.log('[CREATE-MEAL-CLIENT] ⏳ No location found, fetching now...');
        
        // Get geolocation
        const geoPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = geoPosition.coords;
        console.log('[CREATE-MEAL-CLIENT] Got coordinates - Latitude: ' + latitude + ', Longitude: ' + longitude);

        try {
          // Reverse geocode to get city/country
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown City';
          const country = data.address.country || 'Unknown Country';

          currentLocation = {
            city,
            country,
            latitude,
            longitude,
          };
          
          setLocation(currentLocation);
          console.log('[CREATE-MEAL-CLIENT] 📍 Location fetched - City: ' + city + ', Country: ' + country);
          console.log('[CREATE-MEAL-CLIENT] 📍 Coordinates - Latitude: ' + latitude.toFixed(6) + ', Longitude: ' + longitude.toFixed(6));
        } catch (geocodeError) {
          console.log('[CREATE-MEAL-CLIENT] Geocoding error, using coordinates:', geocodeError);
          currentLocation = {
            city: 'Current Location',
            country: 'World',
            latitude,
            longitude,
          };
          setLocation(currentLocation);
          console.log('[CREATE-MEAL-CLIENT] 📍 Using coordinates only - Latitude: ' + latitude.toFixed(6) + ', Longitude: ' + longitude.toFixed(6));
        }
      } else {
        console.log('[CREATE-MEAL-CLIENT] 📍 Location already available - City: ' + currentLocation.city + ', Country: ' + currentLocation.country);
        console.log('[CREATE-MEAL-CLIENT] 📍 Coordinates - Latitude: ' + currentLocation.latitude.toFixed(6) + ', Longitude: ' + currentLocation.longitude.toFixed(6));
      }

      // STEP 2: Prepare meal data and trigger contract interaction
      console.log('[CREATE-MEAL-CLIENT] Location confirmed, preparing meal data...');
      console.log('[CREATE-MEAL-CLIENT] Location:', currentLocation);

      // Convert date and time to timestamp
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const mealTimestamp = Math.floor(dateTime.getTime() / 1000);

      const mealData = {
        date: mealTimestamp,
        date_str: formData.date,
        time_str: formData.time,
        restaurant: formData.restaurant.trim(),
        city: currentLocation.city,
        country: currentLocation.country,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        cuisine: formData.cuisine,
        description: formData.description.trim() || undefined,
        maxGuests: parseInt(formData.maxGuests),
        hostId: hostId,
        hostUsername: hostUsername,
        hostAddress: hostAddress,
      };

      console.log('[CREATE-MEAL-CLIENT] Meal data prepared for contract:', mealData);
      
      // Pass to Transaction component - it will handle contract interaction
      console.log('[CREATE-MEAL-CLIENT] 📡 Dispatching createMealTransaction event...');
      console.log('[CREATE-MEAL-CLIENT] Event payload:', mealData);
      window.dispatchEvent(new CustomEvent('createMealTransaction', { detail: mealData }));
      console.log('[CREATE-MEAL-CLIENT] ✅ Event dispatched successfully');
      
      setButtonState('pending');
      console.log('[CREATE-MEAL-CLIENT] Set button state to pending - waiting for Transaction component...');
    } catch (error) {
      console.error('[CREATE-MEAL-CLIENT] Error:', error);
      setButtonState('failed');
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch location or create meal';
      setErrors({ submit: errorMsg });
      setTimeout(() => setButtonState(undefined), 2000);
    }
  };

  const fieldCls = (hasError: boolean) =>
    `w-full px-4 py-4 rounded-xl text-base outline-none transition bg-white border ${
      hasError
        ? 'border-red-300 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100'
    }`;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col pb-32">

      {/* Verification Section */}
      {!isVerified && (
        <div className="px-6 pt-6 flex flex-col gap-4">
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'rgb(var(--gray-0))', border: '1px solid rgb(var(--gray-200))' }}
          >
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgb(var(--info-100))', border: '1px solid rgb(var(--info-200))' }}
            >
              <span className="text-xl flex-shrink-0">🌐</span>
              <div className="flex flex-col gap-0.5">
                <Typography variant="label" level={2} className="text-info-700">
                  World ID Verification Required
                </Typography>
                <Typography variant="body" level={4} className="text-info-700" style={{ opacity: 0.75 }}>
                  You need to verify with World ID before you can create meals.
                </Typography>
              </div>
            </div>
            <VerifyButton onVerificationSuccess={() => setIsVerified(true)} />
          </div>
        </div>
      )}

      {isVerified && (
        <form onSubmit={handleSubmit} className="flex flex-col">

          {/* Restaurant Name */}
          <FormSection label="Restaurant name *">
            <input
              type="text"
              name="restaurant"
              placeholder="Enter restaurant name"
              value={formData.restaurant}
              onChange={handleInputChange}
              className={fieldCls(!!errors.restaurant)}
            />
            {errors.restaurant && <FieldError>{errors.restaurant}</FieldError>}
          </FormSection>

          {/* Cuisine Type */}
          <FormSection label="Cuisine type *">
            <select
              name="cuisine"
              value={formData.cuisine}
              onChange={handleInputChange}
              className={fieldCls(!!errors.cuisine)}
            >
              <option value="">Select a cuisine...</option>
              <option value="Italian">🇮🇹 Italian</option>
              <option value="Japanese">🇯🇵 Japanese</option>
              <option value="Indian">🇮🇳 Indian</option>
              <option value="Mexican">🇲🇽 Mexican</option>
              <option value="Thai">🇹🇭 Thai</option>
              <option value="Chinese">🇨🇳 Chinese</option>
              <option value="French">🇫🇷 French</option>
              <option value="American">🇺🇸 American</option>
              <option value="Mediterranean">Mediterranean</option>
              <option value="Korean">🇰🇷 Korean</option>
              <option value="Vietnamese">🇻🇳 Vietnamese</option>
              <option value="Other">Other</option>
            </select>
            {errors.cuisine && <FieldError>{errors.cuisine}</FieldError>}
          </FormSection>

          {/* Date & Time */}
          <FormSection label="When">
            <DateTimePicker
              date={formData.date}
              time={formData.time}
              onDateChange={(date) => {
                setFormData((prev) => ({ ...prev, date }));
                if (errors.date) {
                  setErrors((prev) => ({ ...prev, date: '' }));
                }
              }}
              onTimeChange={(time) => {
                setFormData((prev) => ({ ...prev, time }));
                if (errors.time) {
                  setErrors((prev) => ({ ...prev, time: '' }));
                }
              }}
              dateError={errors.date}
              timeError={errors.time}
            />
          </FormSection>

          {/* Max Guests */}
          <FormSection label="Max guests *">
            <select
              name="maxGuests"
              value={formData.maxGuests}
              onChange={handleInputChange}
              className={fieldCls(!!errors.maxGuests)}
            >
              <option value="">Select max guests...</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
              <option value="5">5 guests</option>
              <option value="6">6 guests</option>
            </select>
            {errors.maxGuests && <FieldError>{errors.maxGuests}</FieldError>}
          </FormSection>

          {/* Fee Information */}
          <FormSection label="Platform fees">
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'rgb(var(--gray-50))', border: '1px solid rgb(var(--gray-100))' }}
            >
              <div className="flex justify-between items-center">
                <Typography variant="body" level={4} className="text-gray-500">Host pays</Typography>
                <Typography variant="label" level={2} className="text-gray-900">0.001 WLD</Typography>
              </div>
              <div className="flex justify-between items-center">
                <Typography variant="body" level={4} className="text-gray-500">Each guest pays</Typography>
                <Typography variant="label" level={2} className="text-gray-900">0.001 WLD</Typography>
              </div>
            </div>
          </FormSection>

          {/* Description */}
          <FormSection label="Description (optional)">
            <textarea
              name="description"
              placeholder="Tell guests about the meal, vibe, dress code, etc."
              value={formData.description}
              onChange={handleInputChange}
              className={`${fieldCls(false)} resize-none`}
              rows={3}
            />
          </FormSection>

          {/* Submit Button with Feedback */}
          <div className="px-6 pt-6 pb-4">
            <LiveFeedback
              state={buttonState}
              label={{
                pending: 'Creating meal...',
                success: 'Meal created successfully!',
                failed: 'Failed to create meal',
              }}
            >
              <Button
                type="submit"
                disabled={buttonState === 'pending' || !isVerified}
                size="lg"
                variant="primary"
                fullWidth
              >
                {buttonState === 'pending' ? '⏳ Creating...' : buttonState === 'success' ? '✅ Created!' : '🍽️ Create Meal'}
              </Button>
            </LiveFeedback>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="px-6 pb-4">
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgb(var(--error-100))', border: '1px solid rgb(var(--error-200))' }}
              >
                <Typography variant="body" level={4} className="text-error-700">{errors.submit}</Typography>
              </div>
            </div>
          )}

        </form>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 px-6 py-5"
      style={{ borderBottom: '1px solid rgb(var(--gray-100))' }}
    >
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgb(var(--gray-400))', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body" level={4} className="text-error-600">
      {children}
    </Typography>
  );
}