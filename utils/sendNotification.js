// utils/sendNotification.js
// This file is kept for backward compatibility.
// The actual notification system uses createNotifications from utils/notification.js
// which persists to DB and optionally emits via Socket.IO when enabled.

export const sendNotification = async (userId, message) => {
  // No-op: Use createNotifications() from utils/notification.js instead.
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[sendNotification] Deprecated. Use createNotifications() instead.');
  }
};
