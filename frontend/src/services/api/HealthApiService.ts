import type {
  ApiResponse,
  BuildingReadiness,
  EmbassyEffectiveness,
  SimulationHealth,
  SimulationHealthDashboard,
  ZoneStability,
} from '../../types/index.js';
import { BaseApiService } from './BaseApiService.js';

export class HealthApiService extends BaseApiService {
  getDashboard(simulationId: string): Promise<ApiResponse<SimulationHealthDashboard>> {
    return this.getSimulationData(`/simulations/${simulationId}/health`);
  }

  getSimulationHealth(simulationId: string): Promise<ApiResponse<SimulationHealth>> {
    return this.getSimulationData(`/simulations/${simulationId}/health/simulation`);
  }

  listBuildingReadiness(
    simulationId: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<BuildingReadiness[]>> {
    return this.getSimulationData(`/simulations/${simulationId}/health/buildings`, params);
  }

  listZoneStability(simulationId: string): Promise<ApiResponse<ZoneStability[]>> {
    return this.getSimulationData(`/simulations/${simulationId}/health/zones`);
  }

  listEmbassyEffectiveness(simulationId: string): Promise<ApiResponse<EmbassyEffectiveness[]>> {
    return this.getSimulationData(`/simulations/${simulationId}/health/embassies`);
  }

  listAllSimulationsHealth(): Promise<ApiResponse<SimulationHealth[]>> {
    return this.getPublic('/health/all');
  }

  refreshMetrics(simulationId: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/simulations/${simulationId}/health/refresh`);
  }
}

export const healthApi = new HealthApiService();
