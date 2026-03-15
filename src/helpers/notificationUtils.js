/**
 * Shared helpers for notification display (title, body, type label).
 * Backend sends detailed title and body; this adds type icon/label for UI.
 */
export const NOTIFICATION_TYPES = {
  invoice_generated: { icon: '📄', label: 'Invoice' },
  payment_reminder: { icon: '🔔', label: 'Payment reminder' },
};

export function getNotificationTypeDisplay(type) {
  return NOTIFICATION_TYPES[type] || { icon: '•', label: type || 'Notification' };
}

/**
 * Format notification for list item: use backend title as primary, body as detail.
 * Both title and body are expected to contain full detail from backend.
 */
export function formatNotificationItem(n) {
  const { icon, label } = getNotificationTypeDisplay(n?.type);
  return {
    icon,
    typeLabel: label,
    title: n?.title || 'Notification',
    body: n?.body || '',
    createdAt: n?.createdAt,
    readAt: n?.readAt,
  };
}
