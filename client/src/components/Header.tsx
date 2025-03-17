import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell as BellIcon, 
  Settings as SettingsIcon,
  ShoppingCart
} from 'lucide-react';
import type { Notification } from '@/types';

interface HeaderProps {
  notificationCount: number;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
}

export function Header({
  notificationCount,
  onNotificationsClick,
  onSettingsClick
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <ShoppingCart className="w-6 h-6 text-primary" />
        <h1 className="font-semibold text-lg">SaveCart</h1>
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="p-1 rounded-full hover:bg-gray-100"
          title="Notifications"
          onClick={onNotificationsClick}
        >
          <div className="relative">
            <BellIcon className="w-5 h-5 text-gray-500" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-1 rounded-full hover:bg-gray-100"
          title="Settings"
          onClick={onSettingsClick}
        >
          <SettingsIcon className="w-5 h-5 text-gray-500" />
        </Button>
      </div>
    </header>
  );
}
