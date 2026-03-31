'use client';

import { CheckCircle } from 'iconoir-react';

export const VerificationBadge = ({ verified }: { verified?: boolean }) => {
  if (!verified) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
      <CheckCircle className="w-4 h-4 text-green-600" />
      <span className="text-xs font-semibold text-green-700">World ID Verified</span>
    </div>
  );
};
