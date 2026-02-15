import type { AuthError, Session, User } from '@supabase/supabase-js';
import { appState } from '../AppStateManager.js';
import { supabase } from './client.js';

export class SupabaseAuthService {
  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        appState.setUser(session.user);
        appState.setAccessToken(session.access_token);
      } else {
        appState.setUser(null);
        appState.setAccessToken(null);
      }
    });
  }

  async signUp(
    email: string,
    password: string,
  ): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { user: data.user, error };
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }
}

export const authService = new SupabaseAuthService();
