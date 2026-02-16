import type {
  ApiResponse,
  Invitation,
  InvitationPublicInfo,
  SimulationMember,
} from '../../types/index.js';
import { BaseApiService } from './BaseApiService.js';

export class InvitationsApiService extends BaseApiService {
  create(
    simulationId: string,
    data: { invited_email?: string; invited_role?: string; expires_in_hours?: number },
  ): Promise<ApiResponse<Invitation>> {
    return this.post(`/simulations/${simulationId}/invitations`, data);
  }

  list(simulationId: string): Promise<ApiResponse<Invitation[]>> {
    return this.get(`/simulations/${simulationId}/invitations`);
  }

  validate(token: string): Promise<ApiResponse<InvitationPublicInfo>> {
    return this.get(`/invitations/${token}`);
  }

  accept(token: string): Promise<ApiResponse<SimulationMember>> {
    return this.post(`/invitations/${token}/accept`);
  }
}

export const invitationsApi = new InvitationsApiService();
