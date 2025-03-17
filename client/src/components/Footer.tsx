import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Bell as BellIcon, 
  RefreshCw as RefreshCwIcon,
  ExternalLink
} from 'lucide-react';

interface FooterProps {
  onTogglePriceAlerts: () => void;
  onSyncProducts: () => void;
  arePriceAlertsEnabled: boolean;
  isSyncing: boolean;
}

export function Footer({
  onTogglePriceAlerts,
  onSyncProducts,
  arePriceAlertsEnabled,
  isSyncing
}: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className={`text-sm ${arePriceAlertsEnabled ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
            onClick={onTogglePriceAlerts}
          >
            <div className="flex items-center">
              <BellIcon className="w-4 h-4 mr-1" />
              Price Alerts
            </div>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-gray-600 hover:text-primary"
            onClick={onSyncProducts}
            disabled={isSyncing}
          >
            <div className="flex items-center">
              <RefreshCwIcon className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </div>
          </Button>
        </div>
        <div>
          <Link href="/">
            <Button size="sm" className="px-3 py-1.5 text-sm">
              <div className="flex items-center">
                <span>Open Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </footer>
  );
}
