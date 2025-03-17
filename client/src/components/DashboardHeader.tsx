import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell as BellIcon, 
  Settings as SettingsIcon,
  ShoppingCart
} from 'lucide-react';
import type { User } from '@/types';

interface DashboardHeaderProps {
  user?: User;
  notificationCount: number;
  onNotificationsClick: () => void;
}

export function DashboardHeader({
  user,
  notificationCount,
  onNotificationsClick
}: DashboardHeaderProps) {
  const [location] = useLocation();
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-7 h-7 text-primary" />
            <h1 className="font-bold text-xl">SaveCart</h1>
          </div>
          <div className="hidden md:flex space-x-4">
            <Link href="/">
              <Button
                variant="link"
                className={`h-auto p-0 ${location === '/' ? 'text-neutral-dark font-medium' : 'text-gray-500 hover:text-neutral-dark'}`}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="link"
                className={`h-auto p-0 ${location === '/products' ? 'text-neutral-dark font-medium' : 'text-gray-500 hover:text-neutral-dark'}`}
              >
                My Products
              </Button>
            </Link>
            <Link href="/price-alerts">
              <Button
                variant="link"
                className={`h-auto p-0 ${location === '/price-alerts' ? 'text-neutral-dark font-medium' : 'text-gray-500 hover:text-neutral-dark'}`}
              >
                Price Alerts
              </Button>
            </Link>
            <Link href="/compare">
              <Button
                variant="link"
                className={`h-auto p-0 ${location === '/compare' ? 'text-neutral-dark font-medium' : 'text-gray-500 hover:text-neutral-dark'}`}
              >
                Compare
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative p-1.5 rounded-full hover:bg-gray-100"
            title="Notifications"
            onClick={onNotificationsClick}
          >
            <BellIcon className="w-5 h-5 text-gray-500" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="p-1.5 rounded-full hover:bg-gray-100"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-gray-500" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src={user?.username ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random` : undefined} 
                alt={user?.username || "User"} 
              />
              <AvatarFallback>{user?.username?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:inline">
              {user?.username || "Guest User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
