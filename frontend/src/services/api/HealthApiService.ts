import type {
  ApiResponse,
  BuildingReadiness,
  EmbassyEffectiveness,
  PaginatedResponse,
  SimulationHealth,
  SimulationHealthDashboard,
  ZoneStability,
} from '../../types/index.js';
import { appState } from '../AppStateManager.js';
import { BaseApiService } from './BaseApiService.js';

export class HealthApiService extends BaseApiService {
  getDashboard(simulationId: string): Promise<ApiResponse<SimulationHealthDashboard>> {
    const path = `/simulations/${simulationId}/health`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path);
    }
    return this.get(path);
  }

  getSimulationHealth(simulationId: string): Promise<ApiResponse<SimulationHealth>> {
    const path = `/simulations/${simulationId}/health/simulation`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path);
    }
    return this.get(path);
  }

  listBuildingReadiness(
    simulationId: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<PaginatedResponse<BuildingReadiness>>> {
    const path = `/simulations/${simulationId}/health/buildings`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path, params);
    }
    return this.get(path, params);
  }

  listZoneStability(simulationId: string): Promise<ApiResponse<ZoneStability[]>> {
    const path = `/simulations/${simulationId}/health/zones`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path);
    }
    return this.get(path);
  }

  listEmbassyEffectiveness(simulationId: string): Promise<ApiResponse<EmbassyEffectiveness[]>> {
    const path = `/simulations/${simulationId}/health/embassies`;
    if (!appState.isAuthenticated.value) {
      return this.getPublic(path);
    }
    return this.get(path);
  }

  listAllSimulationsHealth(): Promise<ApiResponse<SimulationHealth[]>> {
    return this.getPublic('/health/all');
  }

  refreshMetrics(simulationId: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/simulations/${simulationId}/health/refresh`);
  }
}

export const healthApi = new HealthApiService();
