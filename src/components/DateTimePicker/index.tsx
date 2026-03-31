'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateError?: string;
  timeError?: string;
}

export const DateTimePicker = ({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: DateTimePickerProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(time ? time.split(':')[0] : '12');
  const [tempMinute, setTempMinute] = useState(time ? time.split(':')[1] : '00');
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Parse date string to Date object
  const selectedDate = date ? new Date(date + 'T00:00:00') : undefined;

  // Handle date selection
  const handleDateSelect = (day: Date | undefined) => {
    if (day) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      onDateChange(formattedDate);
      setShowDatePicker(false);
    }
  };

  // Handle time selection
  const handleTimeSelect = () => {
    const formattedTime = `${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
    onTimeChange(formattedTime);
    setShowTimePicker(false);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDatePicker]);

  // Close time picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };

    if (showTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showTimePicker]);

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">📅 Date *</label>
        <div className="relative" ref={datePickerRef}>
          <input
            type="text"
            value={date ? format(new Date(date + 'T00:00:00'), 'MMM dd, yyyy') : ''}
            onClick={() => setShowDatePicker(!showDatePicker)}
            readOnly
            placeholder="Select a date"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition cursor-pointer ${
              dateError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
            }`}
          />
          
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-lg z-50 p-4">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="text-slate-900"
              />
            </div>
          )}
        </div>
        {dateError && <p className="text-sm text-red-600">{dateError}</p>}
      </div>

      {/* Time Picker */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">⏰ Time *</label>
        <div className="relative" ref={timePickerRef}>
          <input
            type="text"
            value={time ? format(new Date(`2000-01-01T${time}`), 'hh:mm a') : ''}
            onClick={() => setShowTimePicker(!showTimePicker)}
            readOnly
            placeholder="Select a time"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition cursor-pointer ${
              timeError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
            }`}
          />

          {showTimePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-lg z-50 p-4 w-64">
              <div className="space-y-4">
                {/* Hour Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Hour</label>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setTempHour(hour)}
                        className={`py-2 px-2 rounded text-sm font-semibold transition ${
                          tempHour === hour
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minute Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Minute</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => setTempMinute(minute)}
                        className={`py-2 px-2 rounded text-sm font-semibold transition ${
                          tempMinute === minute
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleTimeSelect}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  ✅ Set Time
                </button>
              </div>
            </div>
          )}
        </div>
        {timeError && <p className="text-sm text-red-600">{timeError}</p>}
      </div>
    </div>
  );
};
