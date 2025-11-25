/**
 * Offline Settings Component
 * Integrated into settings page for offline functionality management
 */

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  Trash2, 
  Download,
  Upload,
  FileText,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export const OfflineSettings: React.FC = () => {
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
    savePostOffline,
    getCachedPosts,
    saveDraft,
    updateDraft,
    deleteDraft,
    getAllDrafts,
    getPreferences,
    savePreferences,
    getStorageUsage,
    refreshStatus
  } = useOfflineManager();

  const [showDetails, setShowDetails] = useState(false);
  const [userDrafts, setUserDrafts] = useState<any[]>([]);
  const [cachedPosts, setCachedPosts] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = async () => {
    setIsLoading(true);
    try {
      const [draftsData, postsData, preferences, storage] = await Promise.all([
        getAllDrafts(),
        getCachedPosts(),
        getPreferences(),
        getStorageUsage()
      ]);
      
      setUserDrafts(draftsData);
      setCachedPosts(postsData);
      setUserPreferences(preferences);
      setStorageUsage(storage);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const success = await syncPendingData();
      if (success) {
        await loadOfflineData();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await clearAllData();
        await loadOfflineData();
      } catch (error) {
        console.error('Failed to clear data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshStatus();
      await loadOfflineData();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storagePercentage = storageUsage.total > 0 ? (storageUsage.used / storageUsage.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current network and offline mode status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {isOffline && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Offline mode is enabled. You can view cached content but some features may be limited.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            {!isOnline && hasOfflineData && (
              <Button
                variant="default"
                onClick={enableOfflineMode}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Enable Offline Mode
              </Button>
            )}
            
            {isOnline && pendingSyncCount > 0 && (
              <Button
                variant="default"
                onClick={handleSync}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Sync Now ({pendingSyncCount})
              </Button>
            )}
            
            {isOffline && (
              <Button
                variant="outline"
                onClick={disableOfflineMode}
                disabled={isLoading}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Go Online
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>
            Offline storage usage and available space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used:</span>
              <span>{formatBytes(storageUsage.used)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Available:</span>
              <span>{formatBytes(storageUsage.available)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span>{formatBytes(storageUsage.total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Usage:</span>
              <span>{storagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearData}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            Offline Data
          </CardTitle>
          <CardDescription>
            Cached posts and saved drafts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cached Posts</span>
                <Badge variant="outline">{cachedPosts.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Posts available for offline viewing
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saved Drafts</span>
                <Badge variant="outline">{userDrafts.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Drafts saved locally
              </p>
            </div>
          </div>

          {hasOfflineData && (
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          )}

          {showDetails && (
            <div className="space-y-4 pt-4 border-t">
              {/* Cached Posts */}
              {cachedPosts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Cached Posts ({cachedPosts.length})</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {cachedPosts.slice(0, 5).map((post) => (
                      <div key={post.id} className="text-xs p-2 bg-muted rounded">
                        <div className="font-medium">{post.id}</div>
                        <div className="text-muted-foreground">
                          {post.content?.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {cachedPosts.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{cachedPosts.length - 5} more posts
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Drafts */}
              {userDrafts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Saved Drafts ({userDrafts.length})</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {userDrafts.slice(0, 5).map((draft) => (
                      <div key={draft.id} className="text-xs p-2 bg-muted rounded">
                        <div className="font-medium">{draft.id}</div>
                        <div className="text-muted-foreground">
                          {draft.content?.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(draft.lastModified).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {userDrafts.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{userDrafts.length - 5} more drafts
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Preferences */}
              {userPreferences && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">User Preferences</h4>
                  <div className="text-xs p-2 bg-muted rounded">
                    <div className="font-medium">Theme:</div>
                    <div>{userPreferences.theme}</div>
                    <div className="font-medium mt-1">Font Size:</div>
                    <div>{userPreferences.fontSize}</div>
                    <div className="font-medium mt-1">Language:</div>
                    <div>{userPreferences.language}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Status Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="font-medium">Network:</span>
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium">Offline Mode:</span>
              <div className="flex items-center space-x-1">
                {isOffline ? (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                )}
                <span>{isOffline ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium">Offline Data:</span>
              <div className="flex items-center space-x-1">
                {hasOfflineData ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                )}
                <span>{hasOfflineData ? 'Available' : 'None'}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium">Pending Sync:</span>
              <div className="flex items-center space-x-1">
                {pendingSyncCount > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                <span>{pendingSyncCount > 0 ? `${pendingSyncCount} items` : 'None'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineSettings;