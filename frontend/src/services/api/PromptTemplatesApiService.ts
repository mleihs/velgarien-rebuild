import type { ApiResponse, PromptTemplate } from '../../types/index.js';
import { BaseApiService } from './BaseApiService.js';

export class PromptTemplatesApiService extends BaseApiService {
  list(
    simulationId: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<PromptTemplate[]>> {
    return this.get(`/simulations/${simulationId}/prompt-templates`, params);
  }

  getById(simulationId: string, templateId: string): Promise<ApiResponse<PromptTemplate>> {
    return this.get(`/simulations/${simulationId}/prompt-templates/${templateId}`);
  }

  create(
    simulationId: string,
    data: Partial<PromptTemplate>,
  ): Promise<ApiResponse<PromptTemplate>> {
    return this.post(`/simulations/${simulationId}/prompt-templates`, data);
  }

  update(
    simulationId: string,
    templateId: string,
    data: Partial<PromptTemplate>,
  ): Promise<ApiResponse<PromptTemplate>> {
    return this.put(`/simulations/${simulationId}/prompt-templates/${templateId}`, data);
  }

  remove(simulationId: string, templateId: string): Promise<ApiResponse<PromptTemplate>> {
    return this.delete(`/simulations/${simulationId}/prompt-templates/${templateId}`);
  }

  test(
    simulationId: string,
    data: { template_type: string; locale?: string; variables?: Record<string, string> },
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post(`/simulations/${simulationId}/prompt-templates/test`, data);
  }
}

export const promptTemplatesApi = new PromptTemplatesApiService();
