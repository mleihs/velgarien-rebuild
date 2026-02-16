import type { RealtimeChannel } from '@supabase/realtime-js';
import { appState } from '../AppStateManager.js';
import { supabase } from './client.js';

export interface PresenceState {
  userId: string;
  email: string;
  viewPath: string;
  lastSeen: string;
}

export class PresenceService {
  private channel: RealtimeChannel | null = null;
  private currentSimulationId: string | null = null;

  /**
   * Announce the current user's presence in a simulation.
   * Tracks which view/path they are currently looking at.
   */
  trackPresence(simulationId: string, viewPath: string): void {
    const user = appState.user.value;
    if (!user) {
      console.warn('[PresenceService] Cannot track presence — no authenticated user.');
      return;
    }

    // If switching simulation, tear down old channel first
    if (this.currentSimulationId !== simulationId) {
      this.untrack();
    }

    if (!this.channel) {
      this.channel = supabase.channel(`presence:sim:${simulationId}`, {
        config: { presence: { key: user.id } },
      });
      this.channel.subscribe((status, err) => {
        if (err) {
          console.error('[PresenceService] Subscription error:', err);
          return;
        }
        if (status === 'SUBSCRIBED') {
          this.sendTrack(user.id, user.email ?? '', viewPath);
        }
      });
      this.currentSimulationId = simulationId;
    } else {
      // Already subscribed — just update the tracked payload
      this.sendTrack(user.id, user.email ?? '', viewPath);
    }
  }

  /**
   * Listen for presence changes within a simulation.
   * The callback receives the full list of currently present users
   * whenever someone joins, leaves, or updates their state.
   */
  onPresenceChange(simulationId: string, callback: (presences: PresenceState[]) => void): void {
    // Ensure we have a channel for this simulation
    if (!this.channel || this.currentSimulationId !== simulationId) {
      this.channel = supabase.channel(`presence:sim:${simulationId}`, {
        config: { presence: { key: appState.user.value?.id ?? 'anon' } },
      });
      this.currentSimulationId = simulationId;
    }

    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel?.presenceState<PresenceState>() ?? {};
      const presences: PresenceState[] = [];
      for (const entries of Object.values(state)) {
        for (const entry of entries) {
          presences.push({
            userId: entry.userId,
            email: entry.email,
            viewPath: entry.viewPath,
            lastSeen: entry.lastSeen,
          });
        }
      }
      callback(presences);
    });

    // Subscribe if not already subscribed
    if (!this.channel.joinedOnce) {
      this.channel.subscribe();
    }
  }

  /** Stop tracking presence and tear down the channel. */
  untrack(): void {
    if (this.channel) {
      this.channel.untrack();
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.currentSimulationId = null;
    }
  }

  private sendTrack(userId: string, email: string, viewPath: string): void {
    this.channel?.track({
      userId,
      email,
      viewPath,
      lastSeen: new Date().toISOString(),
    });
  }
}

export const presenceService = new PresenceService();
