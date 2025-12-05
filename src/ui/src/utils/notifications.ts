// Enhanced Toast Notification System
// Based on UI-update.md specifications

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationAction {
  label: string;
  onClick: () => void;
}

interface NotificationOptions {
  title?: string;
  message: string;
  color?: NotificationType;
  autoClose?: number | false; // milliseconds, default 5000
  onClick?: () => void;
  onClose?: () => void;
  action?: NotificationAction;
  dismissible?: boolean; // default true
  snoozable?: boolean; // for recurring warnings
  onSnooze?: () => void;
  id?: string;
}

interface NotificationData extends NotificationOptions {
  id: string;
  timestamp: number;
  snoozedUntil?: number;
}

class NotificationManager {
  private container: HTMLDivElement | null = null;
  private notifications: Map<string, HTMLDivElement> = new Map();
  private notificationData: Map<string, NotificationData> = new Map();
  private listeners: Set<(count: number) => void> = new Set();

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast toast-top toast-end z-[9999]';
      this.container.id = 'notification-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private getToastClass(type: NotificationType): string {
    const baseClasses = 'alert shadow-lg';
    switch (type) {
      case 'success':
        return `${baseClasses} alert-success`;
      case 'warning':
        return `${baseClasses} alert-warning`;
      case 'error':
        return `${baseClasses} alert-error`;
      case 'info':
      default:
        return `${baseClasses} alert-info`;
    }
  }

  show(options: NotificationOptions & { id?: string }): string {
    const id = options.id || `notification-${Date.now()}-${Math.random()}`;
    const container = this.ensureContainer();
    const type = options.color || 'info';
    
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = this.getToastClass(type);
    notification.setAttribute('role', 'alert');
    
    const content = document.createElement('div');
    content.className = 'flex-1';
    
    if (options.title) {
      const title = document.createElement('div');
      title.className = 'font-bold';
      title.textContent = options.title;
      content.appendChild(title);
    }
    
    const message = document.createElement('div');
    message.className = 'text-sm';
    message.textContent = options.message;
    content.appendChild(message);
    
    notification.appendChild(content);
    
    if (options.onClick) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', options.onClick);
    }
    
    container.appendChild(notification);
    this.notifications.set(id, notification);
    
    // Store notification data
    this.notificationData.set(id, {
      ...options,
      id,
      timestamp: Date.now(),
    });
    
    // Notify listeners of count change
    this.notifyListeners();
    
    // Auto close
    if (options.autoClose !== false) {
      const timeout = options.autoClose || 5000;
      setTimeout(() => {
        this.hide(id);
        if (options.onClose) {
          options.onClose();
        }
      }, timeout);
    }
    
    return id;
  }

  update(id: string, options: Partial<NotificationOptions>): void {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    if (options.message) {
      const messageEl = notification.querySelector('.text-sm');
      if (messageEl) {
        messageEl.textContent = options.message;
      }
    }
    
    if (options.title) {
      const titleEl = notification.querySelector('.font-bold');
      if (titleEl) {
        titleEl.textContent = options.title;
      } else {
        const title = document.createElement('div');
        title.className = 'font-bold';
        title.textContent = options.title;
        const content = notification.querySelector('.flex-1');
        if (content) {
          content.insertBefore(title, content.firstChild);
        }
      }
    }
  }

  hide(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
      setTimeout(() => {
        notification.remove();
        this.notifications.delete(id);
        this.notificationData.delete(id);
        this.notifyListeners();
      }, 300);
    }
  }

  clear(): void {
    this.notifications.forEach((_, id) => this.hide(id));
  }

  getCount(): number {
    return this.notifications.size;
  }

  subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current count
    listener(this.getCount());
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  getAll(): NotificationData[] {
    return Array.from(this.notificationData.values());
  }

  private notifyListeners(): void {
    const count = this.getCount();
    this.listeners.forEach((listener) => {
      listener(count);
    });
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Export API
export const notifications = {
  show: (options: NotificationOptions) => {
    return notificationManager.show(options);
  },
  update: (id: string, options: Partial<NotificationOptions>) => {
    notificationManager.update(id, options);
  },
  hide: (id: string) => {
    notificationManager.hide(id);
  },
  clear: () => {
    notificationManager.clear();
  },
  getCount: () => {
    return notificationManager.getCount();
  },
  subscribe: (listener: (count: number) => void) => {
    return notificationManager.subscribe(listener);
  },
  getAll: () => {
    return notificationManager.getAll();
  },
};

export type { NotificationOptions, NotificationData };

