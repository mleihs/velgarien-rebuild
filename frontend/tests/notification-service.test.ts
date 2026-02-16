import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// NotificationService uses @preact/signals-core which works in Node, so we
// can test it directly. However, it also uses crypto.randomUUID() which is
// available in Node 19+. We mock it for deterministic IDs.
// ---------------------------------------------------------------------------

import { NotificationService } from '../src/services/NotificationService.js';
import type { AppNotification } from '../src/services/NotificationService.js';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // addNotification
  // -----------------------------------------------------------------------

  describe('addNotification', () => {
    it('should add a notification to the list', () => {
      service.addNotification({
        type: 'system',
        title: 'Test',
        message: 'Hello',
      });

      expect(service.notifications.value).toHaveLength(1);
      expect(service.notifications.value[0].title).toBe('Test');
      expect(service.notifications.value[0].message).toBe('Hello');
      expect(service.notifications.value[0].type).toBe('system');
    });

    it('should auto-set read to false', () => {
      service.addNotification({
        type: 'system',
        title: 'Test',
        message: 'Hello',
      });

      expect(service.notifications.value[0].read).toBe(false);
    });

    it('should auto-generate an id', () => {
      service.addNotification({
        type: 'system',
        title: 'Test',
        message: 'Hello',
      });

      expect(service.notifications.value[0].id).toBeDefined();
      expect(typeof service.notifications.value[0].id).toBe('string');
      expect(service.notifications.value[0].id.length).toBeGreaterThan(0);
    });

    it('should auto-set createdAt timestamp', () => {
      service.addNotification({
        type: 'system',
        title: 'Test',
        message: 'Hello',
      });

      const createdAt = service.notifications.value[0].createdAt;
      expect(createdAt).toBeDefined();
      // Should be a valid ISO date string
      expect(new Date(createdAt).toISOString()).toBe(createdAt);
    });

    it('should prepend new notifications (newest first)', () => {
      service.addNotification({ type: 'system', title: 'First', message: 'msg1' });
      service.addNotification({ type: 'system', title: 'Second', message: 'msg2' });
      service.addNotification({ type: 'system', title: 'Third', message: 'msg3' });

      expect(service.notifications.value[0].title).toBe('Third');
      expect(service.notifications.value[1].title).toBe('Second');
      expect(service.notifications.value[2].title).toBe('First');
    });

    it('should accept optional actionUrl', () => {
      service.addNotification({
        type: 'invitation',
        title: 'Invite',
        message: 'You were invited',
        actionUrl: '/accept/abc',
      });

      expect(service.notifications.value[0].actionUrl).toBe('/accept/abc');
    });

    it('should accept all notification types', () => {
      const types: AppNotification['type'][] = [
        'invitation',
        'entity_change',
        'ai_complete',
        'system',
      ];

      for (const type of types) {
        service.addNotification({ type, title: `Type: ${type}`, message: 'msg' });
      }

      expect(service.notifications.value).toHaveLength(4);
    });
  });

  // -----------------------------------------------------------------------
  // markAsRead
  // -----------------------------------------------------------------------

  describe('markAsRead', () => {
    it('should mark a specific notification as read', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      const id = service.notifications.value[0].id; // 'B' (newest first)
      service.markAsRead(id);

      const target = service.notifications.value.find((n) => n.id === id);
      expect(target?.read).toBe(true);
    });

    it('should not affect other notifications', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      const idB = service.notifications.value[0].id;
      service.markAsRead(idB);

      const other = service.notifications.value.find((n) => n.id !== idB);
      expect(other?.read).toBe(false);
    });

    it('should be a no-op for a non-existent id', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.markAsRead('nonexistent-id');

      expect(service.notifications.value[0].read).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // markAllAsRead
  // -----------------------------------------------------------------------

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });
      service.addNotification({ type: 'system', title: 'C', message: 'msg' });

      service.markAllAsRead();

      for (const n of service.notifications.value) {
        expect(n.read).toBe(true);
      }
    });

    it('should be a no-op when there are no notifications', () => {
      service.markAllAsRead();
      expect(service.notifications.value).toHaveLength(0);
    });

    it('should not create duplicates', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      service.markAllAsRead();

      expect(service.notifications.value).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // removeNotification
  // -----------------------------------------------------------------------

  describe('removeNotification', () => {
    it('should remove a notification by id', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      const idToRemove = service.notifications.value[0].id;
      service.removeNotification(idToRemove);

      expect(service.notifications.value).toHaveLength(1);
      expect(service.notifications.value.find((n) => n.id === idToRemove)).toBeUndefined();
    });

    it('should be a no-op for a non-existent id', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.removeNotification('nonexistent-id');
      expect(service.notifications.value).toHaveLength(1);
    });

    it('should handle removing the last notification', () => {
      service.addNotification({ type: 'system', title: 'Only', message: 'msg' });
      const id = service.notifications.value[0].id;
      service.removeNotification(id);
      expect(service.notifications.value).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // clearAll
  // -----------------------------------------------------------------------

  describe('clearAll', () => {
    it('should remove all notifications', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });
      service.addNotification({ type: 'system', title: 'C', message: 'msg' });

      service.clearAll();

      expect(service.notifications.value).toHaveLength(0);
    });

    it('should be a no-op when already empty', () => {
      service.clearAll();
      expect(service.notifications.value).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // unreadCount (computed signal)
  // -----------------------------------------------------------------------

  describe('unreadCount', () => {
    it('should be 0 when there are no notifications', () => {
      expect(service.unreadCount.value).toBe(0);
    });

    it('should reflect the number of unread notifications', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });
      service.addNotification({ type: 'system', title: 'C', message: 'msg' });

      expect(service.unreadCount.value).toBe(3);
    });

    it('should decrease when a notification is marked as read', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      expect(service.unreadCount.value).toBe(2);

      service.markAsRead(service.notifications.value[0].id);

      expect(service.unreadCount.value).toBe(1);
    });

    it('should be 0 after markAllAsRead', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      service.markAllAsRead();

      expect(service.unreadCount.value).toBe(0);
    });

    it('should decrease when an unread notification is removed', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      expect(service.unreadCount.value).toBe(2);

      service.removeNotification(service.notifications.value[0].id);

      expect(service.unreadCount.value).toBe(1);
    });

    it('should not change when a read notification is removed', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      const id = service.notifications.value[0].id;
      service.markAsRead(id);

      expect(service.unreadCount.value).toBe(1);

      service.removeNotification(id);

      expect(service.unreadCount.value).toBe(1);
    });

    it('should be 0 after clearAll', () => {
      service.addNotification({ type: 'system', title: 'A', message: 'msg' });
      service.addNotification({ type: 'system', title: 'B', message: 'msg' });

      service.clearAll();

      expect(service.unreadCount.value).toBe(0);
    });
  });
});
