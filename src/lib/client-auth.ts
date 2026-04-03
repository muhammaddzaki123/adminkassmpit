export async function clearClientAuthSession(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore network errors and continue clearing local state.
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');

    // Fallback cleanup for non-httpOnly cookies if any were set previously.
    document.cookie = 'token=; Max-Age=0; path=/';
    document.cookie = 'auth-token=; Max-Age=0; path=/';
    document.cookie = 'user-session=; Max-Age=0; path=/';
  }
}