import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { notifications, NotificationData } from '../utils/notifications';

/**
 * Notification Center component for TopToolbar
 * Shows notification count badge and dropdown with all notifications
 * Based on UI-update.md specifications
 */
const NotificationCenter: React.FC = () => {
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState<NotificationData[]>([]);

  useEffect(() => {
    // Subscribe to notification count changes
    const unsubscribe = notifications.subscribe((newCount) => {
      setCount(newCount);
      if (isOpen) {
        setNotificationList(notifications.getAll());
      }
    });

    // Initial count
    setCount(notifications.getCount());
    setNotificationList(notifications.getAll());

    return unsubscribe;
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setNotificationList(notifications.getAll());
    }
  };

  const handleDismiss = (id: string) => {
    notifications.hide(id);
  };

  const handleClearAll = () => {
    notifications.clear();
    setIsOpen(false);
  };

  if (count === 0 && !isOpen) {
    return null;
  }

  return (
    <div className="relative">
      <button
        className="relative btn btn-ghost btn-sm"
        onClick={handleToggle}
        aria-label={`Notifications${count > 0 ? ` (${count})` : ''}`}
      >
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-base-200 border border-base-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h3 className="font-semibold">Notifications</h3>
              {notificationList.length > 0 && (
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notificationList.length === 0 ? (
                <div className="p-4 text-center text-base-content/60 text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-base-300">
                  {notificationList.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-base-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {notification.title && (
                            <div className="font-semibold text-sm mb-1">
                              {notification.title}
                            </div>
                          )}
                          <div className="text-sm text-base-content/80">
                            {notification.message}
                          </div>
                          {notification.action && (
                            <button
                              className="btn btn-ghost btn-xs mt-2"
                              onClick={() => {
                                notification.action!.onClick();
                                handleDismiss(notification.id);
                              }}
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleDismiss(notification.id)}
                          aria-label="Dismiss notification"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
