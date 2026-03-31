'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Page } from '@/components/PageLayout';
import { ToastProvider } from '@/components/Toast';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<'home' | 'browse' | 'create'>('home');

  const handleTabChange = (tab: 'home' | 'browse' | 'create') => {
    console.log('[LAYOUT] Tab changed to:', tab);
    setActiveTab(tab);
    
    // Update URL query params for browser back/forward support
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?tab=${tab}`;
      console.log('[LAYOUT] Updating URL to:', newUrl);
      window.history.pushState({ tab }, '', newUrl);
      
      // Dispatch custom event to notify home page
      const event = new CustomEvent('tabchange', { detail: { tab } });
      window.dispatchEvent(event);
      console.log('[LAYOUT] Dispatched tabchange event');
    }
  };

  return (
    <ToastProvider>
      <Page>
        {children}
        <Page.Footer className="px-0 fixed bottom-0 w-full bg-white border-t border-slate-200">
          <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        </Page.Footer>
      </Page>
    </ToastProvider>
  );
}
