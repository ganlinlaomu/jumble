/**
 * Offline Indicator Component
 * Shows offline status and provides offline controls
 */

import React, { useState } from 'react';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  FileText,
  Settings
} from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
  const {
    offlineState,
    drafts,
    isOnline,
    isOffline,
    hasOfflineData,
    pendingSyncCount,
    storageInfo,
    enableOfflineMode,
    disableOfflineMode,
    syncPendingData,
    clearAllData,
    refreshStatus
  } = useOfflineManager();

  const [showDetails, setShowDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSync = async () => {
    const success = await syncPendingData();
    if (success) {
      refreshStatus();
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
      await clearAllData();
      refreshStatus();
    }
  };

  return (
    <div className={`fixed bottom-2 right-2 z-50 ${className}`}>
      {/* Main status indicator */}
      <Card className="w-56 shadow-lg sm:w-64 md:w-80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-3 w-3 text-green-500 sm:h-4 sm:w-4" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
              )}
              <span className="font-medium hidden sm:inline">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 w-6 sm:h-8 sm:w-8"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Badge>
            {isOffline && (
              <Badge variant="secondary">
                Offline Mode
              </Badge>
            )}
            {hasOfflineData && (
              <Badge variant="outline">
                <Database className="h-3 w-3 mr-1" />
                Data Available
              </Badge>
            )}
            {pendingSyncCount > 0 && (
              <Badge variant="destructive">
                <Upload className="h-3 w-3 mr-1" />
                {pendingSyncCount} to sync
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>

            {!isOnline && hasOfflineData && (
              <Button
                variant="outline"
                size="sm"
                onClick={enableOfflineMode}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Offline
              </Button>
            )}

            {isOnline && pendingSyncCount > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSync}
                className="flex-1"
              >
                <Upload className="h-3 w-3 mr-1" />
                Sync
              </Button>
            )}
          </div>

          {/* Expandable details */}
          {showDetails && (
            <div className="pt-3 border-t space-y-3">
              {/* Storage info */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Storage Used:</span>
                  <span>{formatBytes(storageInfo.used)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span>{formatBytes(storageInfo.available)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{formatBytes(storageInfo.total)}</span>
                </div>
              </div>

              {/* Drafts info */}
              {drafts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Drafts</span>
                    <Badge variant="outline">{drafts.length}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {drafts.slice(0, 3).map(draft => (
                      <div key={draft.id} className="truncate">
                        • {draft.content.substring(0, 30)}...
                      </div>
                    ))}
                    {drafts.length > 3 && (
                      <div>+{drafts.length - 3} more drafts</div>
                    )}
                  </div>
                </div>
              )}

              {/* Offline data info */}
              {hasOfflineData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Offline Data</span>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Posts and data are available for offline viewing
                  </div>
                </div>
              )}

              {/* Management actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearData}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Data
                </Button>

                {isOffline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disableOfflineMode}
                    className="flex-1"
                  >
                    <Wifi className="h-3 w-3 mr-1" />
                    Go Online
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;