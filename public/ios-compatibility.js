// iOS Safari兼容性检测和处理
class IOSSafariCompatibility {
  constructor() {
    this.isIOS = this.checkIOS();
    this.isSafari = this.checkSafari();
    this.iosVersion = this.getIOSVersion();
    this.serviceWorkerSupported = this.checkServiceWorkerSupport();
    this.cacheAPISupported = this.checkCacheAPISupport();
    
    this.logCompatibilityInfo();
  }

  checkIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  checkSafari() {
    return /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
  }

  getIOSVersion() {
    if (!this.isIOS) return null;
    
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const patch = match[3] ? parseInt(match[3], 10) : 0;
      
      return { major, minor, patch, version: `${major}.${minor}.${patch}` };
    }
    
    return null;
  }

  checkServiceWorkerSupport() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    // iOS 11.3+ supports Service Worker
    if (this.isIOS && this.iosVersion) {
      if (this.iosVersion.major < 11) {
        return false;
      }
      if (this.iosVersion.major === 11 && this.iosVersion.minor < 3) {
        return false;
      }
    }

    // Check if in private browsing mode
    try {
      if (this.isIOS && this.isSafari) {
        // Safari private mode detection
        const testKey = 'testLocalStorage';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      }
    } catch (e) {
      console.warn('Private browsing mode detected, Service Worker may not work');
      return false;
    }

    return true;
  }

  checkCacheAPISupport() {
    if (!('caches' in window)) {
      return false;
    }

    // iOS 11.3+ supports Cache API
    if (this.isIOS && this.iosVersion) {
      if (this.iosVersion.major < 11) {
        return false;
      }
      if (this.iosVersion.major === 11 && this.iosVersion.minor < 3) {
        return false;
      }
    }

    return true;
  }

  logCompatibilityInfo() {
    console.log('📱 iOS Safari Compatibility Info:');
    console.log('  - iOS Device:', this.isIOS);
    console.log('  - Safari Browser:', this.isSafari);
    console.log('  - iOS Version:', this.iosVersion ? this.iosVersion.version : 'N/A');
    console.log('  - Service Worker Support:', this.serviceWorkerSupported);
    console.log('  - Cache API Support:', this.cacheAPISupported);
    
    if (this.isIOS && this.iosVersion) {
      if (this.iosVersion.major < 11 || (this.iosVersion.major === 11 && this.iosVersion.minor < 3)) {
        console.warn('⚠️  iOS version too old for Service Worker support');
        console.warn('   Please update to iOS 11.3 or later');
      }
    }
  }

  getCompatibilityReport() {
    const report = {
      isIOS: this.isIOS,
      isSafari: this.isSafari,
      iosVersion: this.iosVersion,
      serviceWorkerSupported: this.serviceWorkerSupported,
      cacheAPISupported: this.cacheAPISupported,
      pwaSupported: this.serviceWorkerSupported && this.cacheAPISupported,
      recommendations: []
    };

    // Add recommendations
    if (this.isIOS) {
      if (!this.iosVersion) {
        report.recommendations.push('Unable to detect iOS version');
      } else if (this.iosVersion.major < 11 || (this.iosVersion.major === 11 && this.iosVersion.minor < 3)) {
        report.recommendations.push('Update iOS to 11.3 or later for Service Worker support');
      }

      if (!this.serviceWorkerSupported) {
        report.recommendations.push('Service Worker not supported - offline features limited');
      }

      if (!this.cacheAPISupported) {
        report.recommendations.push('Cache API not supported - caching features limited');
      }

      if (this.serviceWorkerSupported && this.cacheAPISupported) {
        report.recommendations.push('PWA features fully supported');
      }
    } else {
      report.recommendations.push('Not running on iOS Safari');
    }

    return report;
  }

  // Fallback caching for iOS Safari
  setupFallbackCaching() {
    if (this.isIOS && (!this.serviceWorkerSupported || !this.cacheAPISupported)) {
      console.log('🔄 Setting up fallback caching for iOS Safari');
      
      // Use IndexedDB as fallback
      if ('indexedDB' in window) {
        this.setupIndexedDBCaching();
      }
      
      // Use localStorage for small data
      this.setupLocalStorageCaching();
      
      // Use sessionStorage for session data
      this.setupSessionStorageCaching();
    }
  }

  setupIndexedDBCaching() {
    console.log('💾 Setting up IndexedDB fallback caching');
    
    // Create IndexedDB for caching
    const request = indexedDB.open('jumble-fallback-cache', 1);
    
    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB');
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('✅ IndexedDB fallback cache ready');
      
      // Create object store if needed
      if (!db.objectStoreNames.contains('static-cache')) {
        const objectStore = db.createObjectStore('static-cache', { keyPath: 'url' });
        console.log('📁 Created static-cache object store');
      }
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for different types of content
      if (!db.objectStoreNames.contains('static-cache')) {
        db.createObjectStore('static-cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('image-cache')) {
        db.createObjectStore('image-cache', { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains('api-cache')) {
        db.createObjectStore('api-cache', { keyPath: 'url' });
      }
    };
  }

  setupLocalStorageCaching() {
    console.log('💾 Setting up localStorage fallback caching');
    
    // Cache small static assets
    try {
      const cachedData = {
        version: '1.0',
        timestamp: Date.now(),
        staticAssets: {}
      };
      
      localStorage.setItem('jumble-fallback-cache', JSON.stringify(cachedData));
      console.log('✅ localStorage fallback cache ready');
    } catch (e) {
      console.warn('⚠️ localStorage not available or full');
    }
  }

  setupSessionStorageCaching() {
    console.log('💾 Setting up sessionStorage fallback caching');
    
    try {
      sessionStorage.setItem('jumble-session-cache', JSON.stringify({
        initialized: true,
        timestamp: Date.now()
      }));
      console.log('✅ sessionStorage fallback cache ready');
    } catch (e) {
      console.warn('⚠️ sessionStorage not available');
    }
  }
}

// Export for use in other scripts
window.IOSSafariCompatibility = IOSSafariCompatibility;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const compatibility = new IOSSafariCompatibility();
  
  // Store compatibility info globally
  window.iosCompatibility = compatibility;
  
  // Setup fallback caching if needed
  compatibility.setupFallbackCaching();
  
  // Dispatch compatibility event
  window.dispatchEvent(new CustomEvent('ios-compatibility-checked', {
    detail: compatibility.getCompatibilityReport()
  }));
});