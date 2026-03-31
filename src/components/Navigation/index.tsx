'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, Compass, Plus } from 'iconoir-react';

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = ({ activeTab, onTabChange }: { activeTab?: 'home' | 'browse' | 'create'; onTabChange?: (tab: 'home' | 'browse' | 'create') => void }) => {
  const handleChange = (newValue: string) => {
    console.log('[NAVIGATION] Tab changed to:', newValue);
    if (onTabChange) {
      console.log('[NAVIGATION] Calling onTabChange callback');
      onTabChange(newValue as 'home' | 'browse' | 'create');
    }
  };

  return (
    <Tabs value={activeTab || 'home'} onValueChange={handleChange}>
      <TabItem value="home" icon={<Home />} label="Home" />
      <TabItem value="browse" icon={<Compass />} label="Browse" />
      <TabItem value="create" icon={<Plus />} label="Create" />
    </Tabs>
  );
};
