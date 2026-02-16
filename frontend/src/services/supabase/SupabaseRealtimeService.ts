import type { RealtimeChannel } from '@supabase/realtime-js';
import type { ChatMessage } from '../../types/index.js';
import { supabase } from './client.js';

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export class SupabaseRealtimeService {
  private channels = new Map<string, RealtimeChannel>();
  private channelCounter = 0;

  /**
   * Subscribe to INSERT/UPDATE/DELETE changes on a table,
   * filtered by simulation_id.
   *
   * @returns A channel ID that can be used to unsubscribe later.
   */
  subscribeToTable(
    table: string,
    simulationId: string,
    callback: (payload: RealtimePayload) => void,
  ): string {
    const channelId = this.nextChannelId(`table:${table}:${simulationId}`);

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `simulation_id=eq.${simulationId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as RealtimePayload['eventType'],
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          });
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`[RealtimeService] Subscription error on ${channelId}:`, err);
        } else if (status === 'SUBSCRIBED') {
          console.debug(`[RealtimeService] Subscribed to ${channelId}`);
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  /**
   * Subscribe to new chat messages for a specific conversation.
   *
   * @returns A channel ID that can be used to unsubscribe later.
   */
  subscribeToChat(conversationId: string, callback: (msg: ChatMessage) => void): string {
    const channelId = this.nextChannelId(`chat:${conversationId}`);

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        },
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error(`[RealtimeService] Chat subscription error on ${channelId}:`, err);
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  /** Remove a single subscription by channel ID. */
  unsubscribe(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return;
    }
    supabase.removeChannel(channel);
    this.channels.delete(channelId);
  }

  /** Remove all active subscriptions. */
  unsubscribeAll(): void {
    for (const [id, channel] of this.channels) {
      supabase.removeChannel(channel);
      this.channels.delete(id);
    }
  }

  private nextChannelId(prefix: string): string {
    this.channelCounter += 1;
    return `${prefix}:${this.channelCounter}`;
  }
}

export const realtimeService = new SupabaseRealtimeService();
