import type { ApiResponse, NotificationPreferences } from '../../types/index.js';
import { BaseApiService } from './BaseApiService.js';

class NotificationPreferencesApiServiceImpl extends BaseApiService {
  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return this.get<NotificationPreferences>('/users/me/notification-preferences');
  }

  async updatePreferences(
    prefs: NotificationPreferences,
  ): Promise<ApiResponse<NotificationPreferences>> {
    return this.post<NotificationPreferences>('/users/me/notification-preferences', prefs);
  }
}

export const notificationPreferencesApi = new NotificationPreferencesApiServiceImpl();
