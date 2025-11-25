/**
 * Mobile-optimized Offline Indicator Component
 * Compact version for mobile PWA mode
 */

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Upload,
  Settings
} from 'lucide-react';

interface OfflineIndicatorMobileProps {
  className?: string;
}

export const OfflineIndicatorMobile: React.FC<OfflineIndicatorMobileProps> = ({ className }) => {
  const {
    isOnline,
    isOffline,
    hasOfflineData,
    pendingSyncCount,
    enableOfflineMode,
    syncPendingData,
    refreshStatus
  } = useOfflineManager();

  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  // Auto-hide when online and no pending sync
  useEffect(() => {
    if (isOnline && !pendingSyncCount && !isOffline) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isOnline, pendingSyncCount, isOffline]);

  // Don't show if hidden
  if (!visible) {
    return null;
  }

  const handleSync = async () => {
    const success = await syncPendingData();
    if (success) {
      refreshStatus();
    }
  };

  const handleEnableOffline = () => {
    enableOfflineMode();
    setExpanded(false);
  };

  // Compact mode (default)
  if (!expanded) {
    return (
      <div className={`fixed bottom-16 right-2 z-50 ${className}`}>
        <div className="flex flex-col items-end space-y-2">
          {/* Status dot */}
          <div 
            className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            } shadow-lg cursor-pointer`}
            onClick={() => setExpanded(true)}
            title={isOnline ? 'Online' : 'Offline'}
          />
          
          {/* Sync badge */}
          {pendingSyncCount > 0 && (
            <Badge 
              variant="destructive" 
              className="text-xs px-1.5 py-0.5 cursor-pointer"
              onClick={handleSync}
            >
              {pendingSyncCount}
            </Badge>
          )}
          
          {/* Offline data badge */}
          {!isOnline && hasOfflineData && (
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0.5 cursor-pointer"
              onClick={handleEnableOffline}
            >
              <Database className="h-2 w-2 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Expanded mode
  return (
    <div className={`fixed bottom-16 right-2 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border p-3 w-48">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="font-medium text-sm">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
            {isOnline ? 'Connected' : 'Disconnected'}
          </Badge>
          {isOffline && (
            <Badge variant="secondary" className="text-xs">
              Offline Mode
            </Badge>
          )}
          {hasOfflineData && (
            <Badge variant="outline" className="text-xs">
              <Database className="h-2 w-2 mr-1" />
              Data
            </Badge>
          )}
          {pendingSyncCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              <Upload className="h-2 w-2 mr-1" />
              {pendingSyncCount}
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col space-y-2">
          {!isOnline && hasOfflineData && (
            <Button
              variant="default"
              size="sm"
              onClick={handleEnableOffline}
              className="w-full justify-start text-xs h-8"
            >
              <Database className="h-3 w-3 mr-2" />
              Use Offline Data
            </Button>
          )}
          
          {isOnline && pendingSyncCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSync}
              className="w-full justify-start text-xs h-8"
            >
              <Upload className="h-3 w-3 mr-2" />
              Sync Now
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            className="w-full justify-start text-xs h-8"
          >
            <Settings className="h-3 w-3 mr-2" />
            Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicatorMobile;