/**
 * Cache Persistence Service
 * Tests and manages cache persistence across PWA sessions
 */

interface CacheTestResult {
  cacheName: string;
  urls: string[];
  size: number;
  persistent: boolean;
}

class CachePersistenceService {
  private static instance: CachePersistenceService;

  static getInstance(): CachePersistenceService {
    if (!CachePersistenceService.instance) {
      CachePersistenceService.instance = new CachePersistenceService();
    }
    return CachePersistenceService.instance;
  }

  /**
   * Test if cache persists after PWA page deletion
   */
  async testCachePersistence(): Promise<CacheTestResult[]> {
    const results: CacheTestResult[] = [];
    
    try {
      // Get all cache names
      const cacheNames = await caches.keys();
      console.log('🔍 Found cache names:', cacheNames);
      
      for (const cacheName of cacheNames) {
        try {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          const urls = requests.map(request => request.url);
          
          // Test cache size
          let size = 0;
          for (const request of requests) {
            try {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                size += blob.size;
              }
            } catch (e) {
              console.warn('Failed to calculate size for:', request.url, e);
            }
          }
          
          results.push({
            cacheName,
            urls,
            size,
            persistent: urls.length > 0
          });
          
          console.log(`📦 Cache ${cacheName}: ${urls.length} items, ${this.formatBytes(size)}`);
          
        } catch (error) {
          console.error(`❌ Failed to test cache ${cacheName}:`, error);
          results.push({
            cacheName,
            urls: [],
            size: 0,
            persistent: false
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to test cache persistence:', error);
    }
    
    return results;
  }

  /**
   * Test IndexedDB persistence
   */
  async testIndexedDBPersistence(): Promise<{
    available: boolean;
    databases: string[];
    size: number;
  }> {
    try {
      const databases = await indexedDB.databases();
      console.log('🗄️ Found IndexedDB databases:', databases);
      
      let totalSize = 0;
      
      // Estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        totalSize = estimate.usage || 0;
        console.log(`💾 IndexedDB storage usage: ${this.formatBytes(totalSize)}`);
      }
      
      return {
        available: databases.length > 0,
        databases: databases.map(db => db.name || 'unknown'),
        size: totalSize
      };
      
    } catch (error) {
      console.error('❌ Failed to test IndexedDB persistence:', error);
      return {
        available: false,
        databases: [],
        size: 0
      };
    }
  }

  /**
   * Test LocalStorage persistence
   */
  async testLocalStoragePersistence(): Promise<{
    available: boolean;
    keys: string[];
    size: number;
  }> {
    try {
      const keys = Object.keys(localStorage);
      let size = 0;
      
      // Calculate LocalStorage size
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
      
      console.log(`🔑 LocalStorage: ${keys.length} items, ${this.formatBytes(size)}`);
      
      return {
        available: keys.length > 0,
        keys,
        size
      };
      
    } catch (error) {
      console.error('❌ Failed to test LocalStorage persistence:', error);
      return {
        available: false,
        keys: [],
        size: 0
      };
    }
  }

  /**
   * Test SessionStorage persistence (should not persist)
   */
  async testSessionStoragePersistence(): Promise<{
    available: boolean;
    keys: string[];
    size: number;
  }> {
    try {
      const keys = Object.keys(sessionStorage);
      let size = 0;
      
      // Calculate SessionStorage size
      for (const key of keys) {
        const value = sessionStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
      
      console.log(`🕐 SessionStorage: ${keys.length} items, ${this.formatBytes(size)}`);
      
      return {
        available: keys.length > 0,
        keys,
        size
      };
      
    } catch (error) {
      console.error('❌ Failed to test SessionStorage persistence:', error);
      return {
        available: false,
        keys: [],
        size: 0
      };
    }
  }

  /**
   * Complete persistence test
   */
  async testAllPersistence(): Promise<{
    cache: CacheTestResult[];
    indexedDB: {
      available: boolean;
      databases: string[];
      size: number;
    };
    localStorage: {
      available: boolean;
      keys: string[];
      size: number;
    };
    sessionStorage: {
      available: boolean;
      keys: string[];
      size: number;
    };
    timestamp: number;
    summary: {
      totalSize: number;
      persistent: boolean;
      recommendations: string[];
    };
  }> {
    console.log('🧪 Starting complete persistence test...');
    
    const [cache, indexedDB, localStorage, sessionStorage] = await Promise.all([
      this.testCachePersistence(),
      this.testIndexedDBPersistence(),
      this.testLocalStoragePersistence(),
      this.testSessionStoragePersistence()
    ]);
    
    const totalSize = cache.reduce((sum, c) => sum + c.size, 0) + 
                     indexedDB.size + localStorage.size + sessionStorage.size;
    
    const persistent = cache.some(c => c.persistent) || 
                        indexedDB.available || 
                        localStorage.available;
    
    const recommendations: string[] = [];
    
    if (!persistent) {
      recommendations.push('No persistent data found - cache may have been cleared');
    }
    
    if (totalSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Large storage usage detected - consider clearing old data');
    }
    
    if (cache.length === 0) {
      recommendations.push('Service Worker cache is empty - try browsing some pages first');
    }
    
    const result = {
      cache,
      indexedDB,
      localStorage,
      sessionStorage,
      timestamp: Date.now(),
      summary: {
        totalSize,
        persistent,
        recommendations
      }
    };
    
    console.log('✅ Persistence test complete:', result);
    return result;
  }

  /**
   * Clear all cache and storage
   */
  async clearAllData(): Promise<void> {
    console.log('🗑️ Clearing all cache and storage...');
    
    try {
      // Clear Cache API
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ Cache API cleared');
      
      // Clear IndexedDB
      const databases = await indexedDB.databases();
      await Promise.all(databases.map(db => 
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ));
      console.log('🗑️ IndexedDB cleared');
      
      // Clear LocalStorage
      localStorage.clear();
      console.log('🗑️ LocalStorage cleared');
      
      // Clear SessionStorage
      sessionStorage.clear();
      console.log('🗑️ SessionStorage cleared');
      
      console.log('✅ All data cleared successfully');
      
    } catch (error) {
      console.error('❌ Failed to clear all data:', error);
      throw error;
    }
  }

  /**
   * Add test data to verify persistence
   */
  async addTestData(): Promise<void> {
    console.log('📝 Adding test data...');
    
    try {
      // Add to LocalStorage
      localStorage.setItem('persistence-test', JSON.stringify({
        timestamp: Date.now(),
        data: 'Test data for persistence verification'
      }));
      
      // Add to Cache API
      const cache = await caches.open('persistence-test-cache');
      await cache.add('/persistence-test-url');
      
      console.log('✅ Test data added successfully');
      
    } catch (error) {
      console.error('❌ Failed to add test data:', error);
      throw error;
    }
  }

  /**
   * Check if test data persists
   */
  async checkTestData(): Promise<{
    localStorage: boolean;
    cache: boolean;
    timestamp: number | null;
  }> {
    console.log('🔍 Checking test data persistence...');
    
    try {
      // Check LocalStorage
      const localStorageData = localStorage.getItem('persistence-test');
      let localStorageResult = false;
      let timestamp = null;
      
      if (localStorageData) {
        try {
          const parsed = JSON.parse(localStorageData);
          localStorageResult = true;
          timestamp = parsed.timestamp;
        } catch (e) {
          console.warn('Failed to parse LocalStorage test data');
        }
      }
      
      // Check Cache API
      const cache = await caches.open('persistence-test-cache');
      const cachedResponse = await cache.match('/persistence-test-url');
      const cacheResult = !!cachedResponse;
      
      console.log('📊 Test data check results:', {
        localStorage: localStorageResult,
        cache: cacheResult,
        timestamp
      });
      
      return {
        localStorage: localStorageResult,
        cache: cacheResult,
        timestamp
      };
      
    } catch (error) {
      console.error('❌ Failed to check test data:', error);
      return {
        localStorage: false,
        cache: false,
        timestamp: null
      };
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export default CachePersistenceService.getInstance();