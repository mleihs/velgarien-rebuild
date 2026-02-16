import { computed, signal } from '@preact/signals-core';

export interface AppNotification {
  id: string;
  type: 'invitation' | 'entity_change' | 'ai_complete' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);

  readonly unreadCount = computed(() => this.notifications.value.filter((n) => !n.read).length);

  /** Add a new notification with auto-generated id, read=false, and current timestamp. */
  addNotification(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
    const entry: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.value = [entry, ...this.notifications.value];
  }

  /** Mark a single notification as read. */
  markAsRead(id: string): void {
    this.notifications.value = this.notifications.value.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
  }

  /** Mark all notifications as read. */
  markAllAsRead(): void {
    this.notifications.value = this.notifications.value.map((n) =>
      n.read ? n : { ...n, read: true },
    );
  }

  /** Remove a single notification. */
  removeNotification(id: string): void {
    this.notifications.value = this.notifications.value.filter((n) => n.id !== id);
  }

  /** Remove all notifications. */
  clearAll(): void {
    this.notifications.value = [];
  }
}

export const notificationService = new NotificationService();
