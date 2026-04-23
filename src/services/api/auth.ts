import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { AuthResponse, TokenPair } from '@/features/auth/types';
import { User } from '@/types';

function getClient() {
  if (!supabase)
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.development and rebuild.',
    );
  return supabase;
}

function mapUser(u: SupabaseUser): User {
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? '',
    avatarUrl: u.user_metadata?.avatar_url,
    createdAt: u.created_at,
    updatedAt: u.updated_at ?? u.created_at,
  };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Login failed: no session returned');
  return {
    user: mapUser(data.session.user),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data, error } = await getClient().auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.session)
    throw new Error(
      'Account created — check your email to confirm before signing in.',
    );
  return {
    user: mapUser(data.session.user),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const { error } = await getClient().auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

export async function refreshToken(token: string): Promise<TokenPair> {
  const { data, error } = await getClient().auth.refreshSession({ refresh_token: token });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Token refresh failed');
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function logout(): Promise<void> {
  await getClient().auth.signOut();
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const { data, error } = await getClient().auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Google sign-in failed: no session returned');
  return {
    user: mapUser(data.session.user),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function loginWithApple(identityToken: string): Promise<AuthResponse> {
  const { data, error } = await getClient().auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Apple sign-in failed: no session returned');
  return {
    user: mapUser(data.session.user),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}
