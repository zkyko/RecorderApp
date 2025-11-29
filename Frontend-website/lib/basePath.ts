/**
 * Get the base path for assets
 * In production with GitHub Pages, this is '/RecorderApp'
 * In development, this is ''
 */
export function getBasePath(): string {
  if (typeof window !== 'undefined') {
    // Client-side: check if we're on GitHub Pages
    const pathname = window.location.pathname;
    if (pathname.startsWith('/RecorderApp')) {
      return '/RecorderApp';
    }
    return '';
  }
  // Server-side: use environment variable or default
  return process.env.BASE_PATH || '/RecorderApp';
}

