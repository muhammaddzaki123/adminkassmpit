interface ClearClientAuthSessionOptions {
  skipServerLogout?: boolean;
}

export async function clearClientAuthSession(options: ClearClientAuthSessionOptions = {}): Promise<void> {
  try {
    if (!options.skipServerLogout) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    }
  } catch {
    // Ignore network errors and continue clearing local state.
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth:lastActivityAt');
    localStorage.removeItem('auth:sessionStartedAt');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');

    // Fallback cleanup for non-httpOnly cookies if any were set previously.
    document.cookie = 'token=; Max-Age=0; path=/';
    document.cookie = 'auth-token=; Max-Age=0; path=/';
    document.cookie = 'user-session=; Max-Age=0; path=/';
  }
}