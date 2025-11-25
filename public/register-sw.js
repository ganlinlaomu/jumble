/**
 * Service Worker Registration Script
 * Handles custom Service Worker registration and updates
 */

class ServiceWorkerRegistration {
  constructor() {
    this.swPath = '/sw.js';
    this.isSupported = 'serviceWorker' in navigator;
    this.registration = null;
  }

  async init() {
    if (!this.isSupported) {
      console.warn('❌ Service Worker not supported');
      return false;
    }

    try {
      // Register custom Service Worker
      this.registration = await navigator.serviceWorker.register(this.swPath);
      console.log('✅ Service Worker registered successfully:', this.registration);

      // Handle updates
      this.handleUpdates();

      // Handle controller changes
      this.handleControllerChange();

      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  handleUpdates() {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const installingWorker = this.registration.installing;
      
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('🔄 New Service Worker version available');
          this.notifyUpdate();
        }
      });
    });
  }

  handleControllerChange() {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed');
      // Reload the page to get the new version
      window.location.reload();
    });
  }

  notifyUpdate() {
    // Show update notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>🔄 New version available</span>
        <button style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Update</button>
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Add click handler
    notification.addEventListener('click', () => {
      if (this.registration && this.registration.waiting) {
        // Send message to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      notification.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);

    document.body.appendChild(notification);
  }

  async unregister() {
    if (!this.isSupported) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      console.log('✅ Service Workers unregistered');
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister Service Workers:', error);
      return false;
    }
  }

  async checkForUpdates() {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      console.log('🔄 Service Worker update check initiated');
      return true;
    } catch (error) {
      console.error('❌ Failed to check for updates:', error);
      return false;
    }
  }

  getRegistration() {
    return this.registration;
  }

  isServiceWorkerActive() {
    return navigator.serviceWorker.controller !== null;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const swReg = new ServiceWorkerRegistration();
    swReg.init();
  });
} else {
  const swReg = new ServiceWorkerRegistration();
  swReg.init();
}

// Export for manual usage
window.ServiceWorkerRegistration = ServiceWorkerRegistration;