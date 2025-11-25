/**
 * Offline Manager Hook
 * Provides offline functionality and state management
 */

import { useState, useEffect, useCallback } from 'react';
import offlineStorageService from '@/services/offline-storage.service';

interface OfflineState {
  isOnline: boolean;
  isOfflineMode: boolean;
  hasOfflineData: boolean;
  storageInfo: {
    used: number;
    available: number;
    total: number;
  };
  pendingSync: number;
}

interface DraftData {
  id: string;
  content: string;
  tags: string[];
  kind: number;
  targetRelays?: string[];
  lastModified: number;
}

export const useOfflineManager = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOfflineMode: false,
    hasOfflineData: false,
    storageInfo: { used: 0, available: 0, total: 0 },
    pendingSync: 0
  });

  const [drafts, setDrafts] = useState<DraftData[]>([]);

  // Update online status
  const updateOnlineStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    const storageInfo = await offlineStorageService.getStorageInfo();
    const allDrafts = await offlineStorageService.getAllDrafts();
    const cachedPosts = await offlineStorageService.getAllCachedPosts();

    setOfflineState(prev => ({
      ...prev,
      isOnline,
      hasOfflineData: cachedPosts.length > 0 || allDrafts.length > 0,
      pendingSync: allDrafts.length,
      storageInfo
    }));

    setDrafts(allDrafts);
  }, []);

  // Initialize and set up listeners
  useEffect(() => {
    updateOnlineStatus();

    const handleOnline = () => {
      console.log('🌐 App is online');
      updateOnlineStatus();
    };

    const handleOffline = () => {
      console.log('📵 App is offline');
      updateOnlineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check storage periodically
    const storageInterval = setInterval(updateOnlineStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(storageInterval);
    };
  }, [updateOnlineStatus]);

  // Post management
  const savePostOffline = useCallback(async (postData: any) => {
    try {
      await offlineStorageService.savePost(postData);
      await updateOnlineStatus();
      return true;
    } catch (error) {
      console.error('❌ Failed to save post offline:', error);
      return false;
    }
  }, [updateOnlineStatus]);

  const getPostOffline = useCallback(async (postId: string) => {
    try {
      return await offlineStorageService.getPost(postId);
    } catch (error) {
      console.error('❌ Failed to get post offline:', error);
      return null;
    }
  }, []);

  const getCachedPosts = useCallback(async () => {
    try {
      return await offlineStorageService.getAllCachedPosts();
    } catch (error) {
      console.error('❌ Failed to get cached posts:', error);
      return [];
    }
  }, []);

  // Draft management
  const saveDraft = useCallback(async (content: string, tags: string[] = [], kind: number = 1, targetRelays?: string[]) => {
    try {
      const draftId = await offlineStorageService.saveDraft({
        content,
        tags,
        kind,
        targetRelays
      });
      await updateOnlineStatus();
      return draftId;
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      throw error;
    }
  }, [updateOnlineStatus]);

  const updateDraft = useCallback(async (id: string, updates: Partial<DraftData>) => {
    try {
      await offlineStorageService.updateDraft(id, updates);
      await updateOnlineStatus();
    } catch (error) {
      console.error('❌ Failed to update draft:', error);
      throw error;
    }
  }, [updateOnlineStatus]);

  const deleteDraft = useCallback(async (id: string) => {
    try {
      await offlineStorageService.deleteDraft(id);
      await updateOnlineStatus();
    } catch (error) {
      console.error('❌ Failed to delete draft:', error);
      throw error;
    }
  }, [updateOnlineStatus]);

  const getDraft = useCallback(async (id: string) => {
    try {
      return await offlineStorageService.getDraft(id);
    } catch (error) {
      console.error('❌ Failed to get draft:', error);
      return null;
    }
  }, []);

  // Preferences management
  const savePreferences = useCallback(async (preferences: any) => {
    try {
      await offlineStorageService.savePreferences(preferences);
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
      throw error;
    }
  }, []);

  const getPreferences = useCallback(async () => {
    try {
      return await offlineStorageService.getPreferences();
    } catch (error) {
      console.error('❌ Failed to get preferences:', error);
      return null;
    }
  }, []);

  // Storage management
  const clearAllData = useCallback(async () => {
    try {
      await offlineStorageService.clearAllData();
      await updateOnlineStatus();
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      throw error;
    }
  }, [updateOnlineStatus]);

  const getStorageUsage = useCallback(async () => {
    try {
      return await offlineStorageService.getStorageInfo();
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }, []);

  // Offline actions
  const enableOfflineMode = useCallback(() => {
    setOfflineState(prev => ({ ...prev, isOfflineMode: true }));
    console.log('📱 Offline mode enabled');
  }, []);

  const disableOfflineMode = useCallback(() => {
    setOfflineState(prev => ({ ...prev, isOfflineMode: false }));
    console.log('🌐 Offline mode disabled');
  }, []);

  // Sync management
  const syncPendingData = useCallback(async () => {
    if (!offlineState.isOnline) {
      console.log('❌ Cannot sync while offline');
      return false;
    }

    try {
      console.log('🔄 Syncing pending data...');
      // TODO: Implement actual sync logic
      await updateOnlineStatus();
      return true;
    } catch (error) {
      console.error('❌ Failed to sync data:', error);
      return false;
    }
  }, [offlineState.isOnline, updateOnlineStatus]);

  return {
    // State
    offlineState,
    drafts,
    isOnline: offlineState.isOnline,
    isOffline: offlineState.isOfflineMode,
    hasOfflineData: offlineState.hasOfflineData,
    pendingSyncCount: offlineState.pendingSync,
    storageInfo: offlineState.storageInfo,

    // Post management
    savePostOffline,
    getPostOffline,
    getCachedPosts,

    // Draft management
    saveDraft,
    updateDraft,
    deleteDraft,
    getDraft,
    getAllDrafts: () => drafts,

    // Preferences
    savePreferences,
    getPreferences,

    // Storage management
    clearAllData,
    getStorageUsage,

    // Offline mode
    enableOfflineMode,
    disableOfflineMode,

    // Sync
    syncPendingData,

    // Utilities
    refreshStatus: updateOnlineStatus
  };
};