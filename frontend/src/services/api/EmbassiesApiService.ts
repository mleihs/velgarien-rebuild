import type { ApiResponse, EchoVector, Embassy, PaginatedResponse } from '../../types/index.js';
import { appState } from '../AppStateManager.js';
import { BaseApiService } from './BaseApiService.js';

export class EmbassiesApiService extends BaseApiService {
  listForSimulation(
    simulationId: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<PaginatedResponse<Embassy>>> {
    const path = `/simulations/${simulationId}/embassies`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path, params);
    }
    return this.get(path, params);
  }

  getById(simulationId: string, embassyId: string): Promise<ApiResponse<Embassy>> {
    const path = `/simulations/${simulationId}/embassies/${embassyId}`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path);
    }
    return this.get(path);
  }

  getForBuilding(simulationId: string, buildingId: string): Promise<ApiResponse<Embassy | null>> {
    const path = `/simulations/${simulationId}/buildings/${buildingId}/embassy`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path);
    }
    return this.get(path);
  }

  create(
    simulationId: string,
    data: {
      building_a_id: string;
      simulation_a_id: string;
      building_b_id: string;
      simulation_b_id: string;
      connection_type?: string;
      description?: string;
      established_by?: string;
      bleed_vector?: EchoVector;
      event_propagation?: boolean;
      embassy_metadata?: Record<string, unknown>;
    },
  ): Promise<ApiResponse<Embassy>> {
    return this.post(`/simulations/${simulationId}/embassies`, data);
  }

  update(
    simulationId: string,
    embassyId: string,
    data: {
      description?: string;
      established_by?: string;
      bleed_vector?: EchoVector;
      event_propagation?: boolean;
      embassy_metadata?: Record<string, unknown>;
    },
  ): Promise<ApiResponse<Embassy>> {
    return this.patch(`/simulations/${simulationId}/embassies/${embassyId}`, data);
  }

  activate(simulationId: string, embassyId: string): Promise<ApiResponse<Embassy>> {
    return this.patch(`/simulations/${simulationId}/embassies/${embassyId}/activate`);
  }

  suspend(simulationId: string, embassyId: string): Promise<ApiResponse<Embassy>> {
    return this.patch(`/simulations/${simulationId}/embassies/${embassyId}/suspend`);
  }

  dissolve(simulationId: string, embassyId: string): Promise<ApiResponse<Embassy>> {
    return this.patch(`/simulations/${simulationId}/embassies/${embassyId}/dissolve`);
  }

  listAllActive(): Promise<ApiResponse<Embassy[]>> {
    return this.getPublic('/embassies');
  }
}

export const embassiesApi = new EmbassiesApiService();
