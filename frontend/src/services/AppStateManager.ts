import { computed, signal } from '@preact/signals-core';
import type { User } from '@supabase/supabase-js';
import type { Simulation, SimulationRole } from '../types/index.js';

export class AppStateManager {
  readonly user = signal<User | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly currentSimulation = signal<Simulation | null>(null);
  readonly simulations = signal<Simulation[]>([]);
  readonly loading = signal<boolean>(false);

  readonly isAuthenticated = computed(() => this.user.value !== null);

  readonly canEdit = computed(() => {
    const sim = this.currentSimulation.value;
    if (!sim || !this.user.value) return false;

    const member = sim.members?.find((m) => m.user_id === this.user.value?.id);
    if (!member) return false;

    const editableRoles: SimulationRole[] = ['owner', 'admin', 'editor'];
    return editableRoles.includes(member.member_role);
  });

  setUser(user: User | null): void {
    this.user.value = user;
  }

  setAccessToken(token: string | null): void {
    this.accessToken.value = token;
  }

  setCurrentSimulation(simulation: Simulation | null): void {
    this.currentSimulation.value = simulation;
  }

  setSimulations(simulations: Simulation[]): void {
    this.simulations.value = simulations;
  }
}

export const appState = new AppStateManager();
