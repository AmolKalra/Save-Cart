import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft } from 'lucide-react';
import type { Notification } from '@/types';
import { checkNotificationPermission, requestNotificationPermission } from '@/lib/chromeApi';

export default function Settings() {
  const { toast } = useToast();
  
  // State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoDetectProducts, setAutoDetectProducts] = useState(true);
  const [priceDropThreshold, setPriceDropThreshold] = useState('5');
  const [email, setEmail] = useState('user@example.com');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  
  // Queries
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?userId=1');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });
  
  // Effects
  React.useEffect(() => {
    const checkPermission = async () => {
      const granted = await checkNotificationPermission();
      setNotificationPermissionGranted(granted);
    };
    
    checkPermission();
  }, []);
  
  // Event handlers
  const handleSaveSettings = () => {
    // In a real app, we would save these settings to the server
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated',
    });
  };
  
  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    
    if (granted) {
      toast({
        title: 'Notifications enabled',
        description: "You'll now receive notifications for price drops",
      });
    } else {
      toast({
        title: 'Notifications disabled',
        description: "You won't receive browser notifications",
        variant: 'destructive',
      });
    }
  };
  
  // Unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (notification: Notification) => !notification.isRead
  ).length;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader 
        notificationCount={unreadNotificationsCount}
        onNotificationsClick={() => {}}
      />
      
      <main className="p-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="pl-0 hover:bg-transparent">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications about price changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive price alerts via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Browser Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive price alerts as browser notifications
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                    disabled={!notificationPermissionGranted}
                  />
                </div>
                
                {!notificationPermissionGranted && (
                  <div className="rounded-md bg-yellow-50 p-3 mt-2">
                    <p className="text-sm text-yellow-700">
                      Browser notifications require permission.
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-yellow-700 hover:text-yellow-800" 
                      onClick={handleRequestNotificationPermission}
                    >
                      Enable notifications
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="price-drop-threshold">Price Drop Threshold</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when price drops by at least this percentage
                  </p>
                  <Select
                    value={priceDropThreshold}
                    onValueChange={setPriceDropThreshold}
                  >
                    <SelectTrigger className="w-full" id="price-drop-threshold">
                      <SelectValue placeholder="Select threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5% or more</SelectItem>
                      <SelectItem value="10">10% or more</SelectItem>
                      <SelectItem value="15">15% or more</SelectItem>
                      <SelectItem value="20">20% or more</SelectItem>
                      <SelectItem value="25">25% or more</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Extension Settings</CardTitle>
                <CardDescription>
                  Configure how the SaveCart extension works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-detect">Auto-detect Products</Label>
                    <p className="text-sm text-gray-500">
                      Automatically detect products when visiting e-commerce sites
                    </p>
                  </div>
                  <Switch
                    id="auto-detect"
                    checked={autoDetectProducts}
                    onCheckedChange={setAutoDetectProducts}
                  />
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="email-address">Email Address</Label>
                  <p className="text-sm text-gray-500">
                    Used for price drop notifications
                  </p>
                  <Input
                    id="email-address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your saved products and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Export Data</h3>
                  <p className="text-sm text-gray-500">
                    Export your saved products and price history
                  </p>
                  <Button variant="outline">
                    Export as CSV
                  </Button>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                  <p className="text-sm text-gray-500">
                    Clear all your saved data from SaveCart
                  </p>
                  <Button variant="destructive">
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
