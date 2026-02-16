import type {
  ApiResponse,
  PaginatedResponse,
  Event as SimEvent,
  SocialTrend,
} from '../../types/index.js';
import { BaseApiService } from './BaseApiService.js';

export class SocialTrendsApiService extends BaseApiService {
  list(
    simulationId: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<PaginatedResponse<SocialTrend>>> {
    return this.get(`/simulations/${simulationId}/social-trends`, params);
  }

  fetch(
    simulationId: string,
    data: { source: string; query: string; limit?: number },
  ): Promise<ApiResponse<SocialTrend[]>> {
    return this.post(`/simulations/${simulationId}/social-trends/fetch`, data);
  }

  transform(
    simulationId: string,
    data: { trend_id: string },
  ): Promise<
    ApiResponse<{
      trend_id: string;
      original_title: string;
      transformation: {
        content: string;
        model_used: string;
        template_source: string;
        locale: string;
      };
    }>
  > {
    return this.post(`/simulations/${simulationId}/social-trends/transform`, data);
  }

  integrate(
    simulationId: string,
    data: {
      trend_id: string;
      title: string;
      description?: string;
      event_type?: string;
      impact_level?: number;
      tags?: string[];
    },
  ): Promise<ApiResponse<SimEvent>> {
    return this.post(`/simulations/${simulationId}/social-trends/integrate`, data);
  }

  workflow(
    simulationId: string,
    data: { source: string; query: string; limit?: number },
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post(`/simulations/${simulationId}/social-trends/workflow`, data);
  }
}

export const socialTrendsApi = new SocialTrendsApiService();
