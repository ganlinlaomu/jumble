/**
 * Offline Banner Component
 * Shows prominent offline status and actions
 */

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface OfflineBannerProps {
  autoHide?: boolean;
  hideDelay?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  autoHide = true, 
  hideDelay = 5000 
}) => {
  const {
    isOnline,
    isOffline,
    hasOfflineData,
    pendingSyncCount,
    enableOfflineMode,
    syncPendingData,
    refreshStatus
  } = useOfflineManager();

  const [visible, setVisible] = useState(true);
  const [lastStatus, setLastStatus] = useState({ isOnline, hasOfflineData });

  useEffect(() => {
    // Show banner when status changes
    if (lastStatus.isOnline !== isOnline || lastStatus.hasOfflineData !== hasOfflineData) {
      setVisible(true);
      setLastStatus({ isOnline, hasOfflineData });

      // Auto-hide when back online
      if (autoHide && isOnline && !pendingSyncCount) {
        const timer = setTimeout(() => {
          setVisible(false);
        }, hideDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, hasOfflineData, pendingSyncCount, autoHide, hideDelay, lastStatus]);

  // Don't show if online with no pending sync
  if (!visible || (isOnline && !pendingSyncCount && !isOffline)) {
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
    setVisible(false);
  };

  if (!isOnline) {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-900">You're Offline</h4>
                  <p className="text-sm text-orange-700">
                    {hasOfflineData 
                      ? 'Offline data is available for viewing'
                      : 'Check your internet connection'
                    }
                  </p>
                </div>
              </div>
              
              {hasOfflineData && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Database className="h-3 w-3 mr-1" />
                  Offline Data Available
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStatus}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              
              {hasOfflineData && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEnableOffline}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Use Offline Data
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Ready to Sync</h4>
                  <p className="text-sm text-blue-700">
                    {pendingSyncCount} item{pendingSyncCount > 1 ? 's' : ''} ready to sync
                  </p>
                </div>
              </div>
              
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {pendingSyncCount} pending
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisible(false)}
              >
                Later
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleSync}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Welcome back online banner
  return (
    <Card className="mb-4 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">You're Back Online</h4>
                <p className="text-sm text-green-700">
                  All features are now available
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible(false)}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineBanner;