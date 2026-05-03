// utils/notificationStorage.js

/**
 * Local Storage Utility for Notifications Management
 * Provides functions to store, retrieve, and manage notifications in localStorage
 */

const STORAGE_KEY = "app_notifications";
const MAX_NOTIFICATIONS = 50; // Limit to prevent storage bloat

/**
 * Get all notifications from localStorage
 * @returns {Array} Array of notification objects
 */
export const getNotifications = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading notifications from localStorage:", error);
    return [];
  }
};

/**
 * Save notifications to localStorage
 * @param {Array} notifications - Array of notification objects
 */
export const saveNotifications = (notifications) => {
  try {
    // Limit the number of notifications to prevent storage issues
    const limitedNotifications = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));
  } catch (error) {
    console.error("Error saving notifications to localStorage:", error);
  }
};

/**
 * Add a new notification
 * @param {Object} notification - Notification object
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.type - Notification type ('success', 'info', 'warning', 'error')
 * @param {string} [notification.id] - Optional custom ID
 * @returns {Object} The created notification object
 */
export const addNotification = (notification) => {
  try {
    const notifications = getNotifications();

    const newNotification = {
      id: notification.id || generateId(),
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      timestamp: new Date().toISOString(),
      time: getRelativeTime(new Date()),
      read: false,
      ...notification, // Allow custom properties
    };

    // Add to the beginning of the array (newest first)
    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(updatedNotifications);

    return newNotification;
  } catch (error) {
    console.error("Error adding notification:", error);
    return null;
  }
};

/**
 * Remove a notification by ID
 * @param {string|number} id - Notification ID
 */
export const removeNotification = (id) => {
  try {
    const notifications = getNotifications();
    const filtered = notifications.filter(
      (notification) => notification.id !== id
    );
    saveNotifications(filtered);
  } catch (error) {
    console.error("Error removing notification:", error);
  }
};

/**
 * Mark a notification as read
 * @param {string|number} id - Notification ID
 */
export const markAsRead = (id) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    saveNotifications(updated);
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = () => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
    saveNotifications(updated);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
};

/**
 * Get unread notifications count
 * @returns {number} Number of unread notifications
 */
export const getUnreadCount = () => {
  try {
    const notifications = getNotifications();
    return notifications.filter((notification) => !notification.read).length;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
};

/**
 * Get notifications by type
 * @param {string} type - Notification type
 * @returns {Array} Filtered notifications
 */
export const getNotificationsByType = (type) => {
  try {
    const notifications = getNotifications();
    return notifications.filter((notification) => notification.type === type);
  } catch (error) {
    console.error("Error filtering notifications by type:", error);
    return [];
  }
};

/**
 * Update notification times (call this periodically to update relative times)
 */
export const updateNotificationTimes = () => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map((notification) => ({
      ...notification,
      time: getRelativeTime(new Date(notification.timestamp)),
    }));
    saveNotifications(updated);
    return updated;
  } catch (error) {
    console.error("Error updating notification times:", error);
    return getNotifications();
  }
};

/**
 * Remove old notifications (older than specified days)
 * @param {number} days - Number of days to keep notifications
 */
export const cleanupOldNotifications = (days = 30) => {
  try {
    const notifications = getNotifications();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filtered = notifications.filter((notification) => {
      const notificationDate = new Date(notification.timestamp);
      return notificationDate >= cutoffDate;
    });

    saveNotifications(filtered);
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
  }
};

/**
 * Get storage usage information
 * @returns {Object} Storage info
 */
export const getStorageInfo = () => {
  try {
    const notifications = getNotifications();
    const storageData = localStorage.getItem(STORAGE_KEY);
    const sizeInBytes = storageData ? new Blob([storageData]).size : 0;

    return {
      count: notifications.length,
      sizeInBytes,
      sizeInKB: Math.round((sizeInBytes / 1024) * 100) / 100,
      unreadCount: getUnreadCount(),
    };
  } catch (error) {
    console.error("Error getting storage info:", error);
    return { count: 0, sizeInBytes: 0, sizeInKB: 0, unreadCount: 0 };
  }
};

// Helper Functions

/**
 * Generate a unique ID for notifications
 * @returns {string} Unique ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get relative time string (e.g., "2 minutes ago")
 * @param {Date} date - Date object
 * @returns {string} Relative time string
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Predefined notification types for consistency
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
};

/**
 * Predefined notification templates for common use cases
 */
export const NOTIFICATION_TEMPLATES = {
  SHIPMENT_DELIVERED: (trackingId) => ({
    title: "Shipment Delivered",
    message: `Package #${trackingId} has been delivered successfully`,
    type: NOTIFICATION_TYPES.SUCCESS,
  }),

  KYC_APPROVED: () => ({
    title: "KYC Approved",
    message: "Your identity verification has been approved",
    type: NOTIFICATION_TYPES.SUCCESS,
  }),

  PAYMENT_RECEIVED: (amount, trackingId) => ({
    title: "Payment Received",
    message: `Payment of ${amount} for shipment #${trackingId} received`,
    type: NOTIFICATION_TYPES.SUCCESS,
  }),

  SHIPMENT_DELAYED: (trackingId, reason) => ({
    title: "Shipment Delayed",
    message: `Package #${trackingId} is delayed: ${reason}`,
    type: NOTIFICATION_TYPES.WARNING,
  }),

  SYSTEM_MAINTENANCE: (startTime) => ({
    title: "System Maintenance",
    message: `Scheduled maintenance will begin at ${startTime}`,
    type: NOTIFICATION_TYPES.INFO,
  }),

  PAYMENT_FAILED: (reason) => ({
    title: "Payment Failed",
    message: `Payment could not be processed: ${reason}`,
    type: NOTIFICATION_TYPES.ERROR,
  }),
};

// Export all functions as default object for easy importing
export default {
  getNotifications,
  saveNotifications,
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  clearAllNotifications,
  getNotificationsByType,
  updateNotificationTimes,
  cleanupOldNotifications,
  getStorageInfo,
  NOTIFICATION_TYPES,
  NOTIFICATION_TEMPLATES,
};
