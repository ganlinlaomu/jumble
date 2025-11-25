/**
 * Offline Storage Service
 * Handles local storage of posts, user data, and offline functionality
 */

interface PostData {
  id: string;
  content: string;
  author: string;
  createdAt: number;
  tags: string[];
  kind: number;
  signature?: string;
  published?: boolean;
  synced?: boolean;
}

interface OfflineDraft {
  id: string;
  content: string;
  tags: string[];
  kind: number;
  createdAt: number;
  lastModified: number;
  targetRelays?: string[];
}

interface CachedPost {
  id: string;
  data: PostData;
  cachedAt: number;
  expiresAt: number;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  defaultRelays: string[];
  mutedUsers: string[];
  mutedWords: string[];
}

class OfflineStorageService {
  private static instance: OfflineStorageService;
  private db: IDBDatabase | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  // Database configuration
  private readonly DB_NAME = 'jumble-offline-storage';
  private readonly DB_VERSION = 2;
  private readonly STORES = {
    POSTS: 'posts',
    DRAFTS: 'drafts',
    PREFERENCES: 'preferences',
    CACHE: 'cache',
    SYNC_QUEUE: 'syncQueue'
  };

  // Cache expiration times (in milliseconds)
  private readonly CACHE_EXPIRATION = {
    POSTS: 24 * 60 * 60 * 1000, // 24 hours
    USER_PROFILES: 7 * 24 * 60 * 60 * 1000, // 7 days
    RELAY_INFO: 30 * 60 * 60 * 1000, // 30 days
    DRAFTS: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  private constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = () => reject(new Error('Failed to open database'));
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = request.result;

          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains(this.STORES.POSTS)) {
            const postsStore = db.createObjectStore(this.STORES.POSTS, { keyPath: 'id' });
            postsStore.createIndex('author', 'author', { unique: false });
            postsStore.createIndex('createdAt', 'createdAt', { unique: false });
            postsStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.STORES.DRAFTS)) {
            const draftsStore = db.createObjectStore(this.STORES.DRAFTS, { keyPath: 'id' });
            draftsStore.createIndex('lastModified', 'lastModified', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.STORES.PREFERENCES)) {
            db.createObjectStore(this.STORES.PREFERENCES, { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
            const cacheStore = db.createObjectStore(this.STORES.CACHE, { keyPath: 'key' });
            cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(this.STORES.SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };
      });

      this.initialized = true;
      console.log('✅ Offline storage initialized successfully');
      
      // Start background processes
      this.startCleanupTimer();
      this.startSyncTimer();
    } catch (error) {
      console.error('❌ Failed to initialize offline storage:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  // Post storage methods
  async savePost(post: PostData): Promise<void> {
    await this.ensureInitialized();
    
    const cachedPost: CachedPost = {
      id: post.id,
      data: post,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.CACHE_EXPIRATION.POSTS
    };

    await this.put(this.STORES.POSTS, cachedPost);
    console.log('📝 Post saved to offline storage:', post.id);
  }

  async getPost(id: string): Promise<PostData | null> {
    await this.ensureInitialized();
    
    try {
      const cachedPost = await this.get<CachedPost>(this.STORES.POSTS, id);
      
      if (cachedPost && cachedPost.expiresAt > Date.now()) {
        return cachedPost.data;
      } else if (cachedPost) {
        // Remove expired post
        await this.delete(this.STORES.POSTS, id);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get post from offline storage:', error);
      return null;
    }
  }

  async getPostsByAuthor(author: string, limit: number = 50): Promise<PostData[]> {
    await this.ensureInitialized();
    
    try {
      const posts: PostData[] = [];
      const store = this.db!.transaction(this.STORES.POSTS, 'readonly').objectStore(this.STORES.POSTS);
      const index = store.index('author');
      const request = index.openCursor(author);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && posts.length < limit) {
            const cachedPost = cursor.value as CachedPost;
            if (cachedPost.expiresAt > Date.now()) {
              posts.push(cachedPost.data);
            }
            cursor.continue();
          } else {
            resolve(posts);
          }
        };

        request.onerror = () => reject(new Error('Failed to get posts by author'));
      });
    } catch (error) {
      console.error('❌ Failed to get posts by author:', error);
      return [];
    }
  }

  async getAllCachedPosts(): Promise<PostData[]> {
    await this.ensureInitialized();
    
    try {
      const posts: PostData[] = [];
      const store = this.db!.transaction(this.STORES.POSTS, 'readonly').objectStore(this.STORES.POSTS);
      const request = store.openCursor();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const cachedPost = cursor.value as CachedPost;
            if (cachedPost.expiresAt > Date.now()) {
              posts.push(cachedPost.data);
            }
            cursor.continue();
          } else {
            resolve(posts);
          }
        };

        request.onerror = () => reject(new Error('Failed to get all cached posts'));
      });
    } catch (error) {
      console.error('❌ Failed to get all cached posts:', error);
      return [];
    }
  }

  // Draft management
  async saveDraft(draft: Omit<OfflineDraft, 'id' | 'createdAt' | 'lastModified'>): Promise<string> {
    await this.ensureInitialized();
    
    const offlineDraft: OfflineDraft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: draft.content,
      tags: draft.tags || [],
      kind: draft.kind || 1,
      targetRelays: draft.targetRelays,
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    await this.put(this.STORES.DRAFTS, offlineDraft);
    console.log('📝 Draft saved:', offlineDraft.id);
    
    return offlineDraft.id;
  }

  async updateDraft(id: string, updates: Partial<OfflineDraft>): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const draft = await this.get<OfflineDraft>(this.STORES.DRAFTS, id);
      if (draft) {
        const updatedDraft = {
          ...draft,
          ...updates,
          lastModified: Date.now()
        };
        await this.put(this.STORES.DRAFTS, updatedDraft);
        console.log('📝 Draft updated:', id);
      } else {
        throw new Error('Draft not found');
      }
    } catch (error) {
      console.error('❌ Failed to update draft:', error);
      throw error;
    }
  }

  async getDraft(id: string): Promise<OfflineDraft | null> {
    await this.ensureInitialized();
    
    try {
      return await this.get<OfflineDraft>(this.STORES.DRAFTS, id);
    } catch (error) {
      console.error('❌ Failed to get draft:', error);
      return null;
    }
  }

  async getAllDrafts(): Promise<OfflineDraft[]> {
    await this.ensureInitialized();
    
    try {
      const store = this.db!.transaction(this.STORES.DRAFTS, 'readonly').objectStore(this.STORES.DRAFTS);
      const request = store.openCursor();

      return new Promise((resolve, reject) => {
        const drafts: OfflineDraft[] = [];
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            drafts.push(cursor.value);
            cursor.continue();
          } else {
            resolve(drafts.sort((a, b) => b.lastModified - a.lastModified));
          }
        };

        request.onerror = () => reject(new Error('Failed to get all drafts'));
      });
    } catch (error) {
      console.error('❌ Failed to get all drafts:', error);
      return [];
    }
  }

  async deleteDraft(id: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.delete(this.STORES.DRAFTS, id);
      console.log('🗑️ Draft deleted:', id);
    } catch (error) {
      console.error('❌ Failed to delete draft:', error);
      throw error;
    }
  }

  // User preferences
  async savePreferences(preferences: UserPreferences): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.put(this.STORES.PREFERENCES, {
        key: 'user_preferences',
        data: preferences,
        updatedAt: Date.now()
      });
      console.log('⚙️ User preferences saved');
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<UserPreferences | null> {
    await this.ensureInitialized();
    
    try {
      const result = await this.get<{ key: string; data: UserPreferences }>(this.STORES.PREFERENCES, 'user_preferences');
      return result ? result.data : null;
    } catch (error) {
      console.error('❌ Failed to get preferences:', error);
      return null;
    }
  }

  // Generic IndexedDB operations
  private async put<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to put data in ${storeName}`));
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get data from ${storeName}`));
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete data from ${storeName}`));
    });
  }

  // Cleanup expired data
  private async cleanupExpiredData(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const now = Date.now();
      
      // Clean up expired posts
      await this.cleanupByIndex(this.STORES.POSTS, 'expiresAt', now);
      
      // Clean up old drafts (older than 30 days)
      const draftExpiry = Date.now() - this.CACHE_EXPIRATION.DRAFTS;
      await this.cleanupByIndex(this.STORES.DRAFTS, 'lastModified', draftExpiry);
      
      // Clean up expired cache entries
      await this.cleanupByIndex(this.STORES.CACHE, 'expiresAt', now);
      
      console.log('🧹 Expired data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup expired data:', error);
    }
  }

  private async cleanupByIndex(storeName: string, indexName: string, threshold: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value[indexName] < threshold) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error(`Failed to cleanup ${storeName}`));
    });
  }

  // Background processes
  private startCleanupTimer(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000);
  }

  private startSyncTimer(): void {
    // Check for sync operations when online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    window.addEventListener('online', () => {
      this.processSyncQueue();
    });
  }

  private async processSyncQueue(): Promise<void> {
    // TODO: Implement sync queue processing
    console.log('🔄 Processing sync queue...');
  }

  // Utility methods
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async getStorageInfo(): Promise<{ used: number; available: number; total: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        total: estimate.quota || 0
      };
    }
    
    return { used: 0, available: 0, total: 0 };
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const storeNames = Object.values(this.STORES);
      
      for (const storeName of storeNames) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
        });
      }
      
      console.log('🗑️ All offline data cleared');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default OfflineStorageService.getInstance();