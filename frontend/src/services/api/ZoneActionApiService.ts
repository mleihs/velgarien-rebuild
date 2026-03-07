import type { ApiResponse, ZoneAction, ZoneActionType } from '../../types/index.js';
import { BaseApiService } from './BaseApiService.js';

export class ZoneActionApiService extends BaseApiService {
  private path(simId: string, zoneId: string): string {
    return `/simulations/${simId}/zones/${zoneId}/actions`;
  }

  list(simId: string, zoneId: string): Promise<ApiResponse<ZoneAction[]>> {
    return this.get<ZoneAction[]>(this.path(simId, zoneId));
  }

  create(
    simId: string,
    zoneId: string,
    data: { action_type: ZoneActionType },
  ): Promise<ApiResponse<ZoneAction>> {
    return this.post<ZoneAction>(this.path(simId, zoneId), data);
  }

  cancel(simId: string, zoneId: string, actionId: string): Promise<ApiResponse<ZoneAction>> {
    return this.delete<ZoneAction>(`${this.path(simId, zoneId)}/${actionId}`);
  }
}

export const zoneActionsApi = new ZoneActionApiService();
