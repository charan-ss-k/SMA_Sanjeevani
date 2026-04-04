const resolveApiBase = () => {
  const viteBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (viteBase) {
    return viteBase.replace(/\/$/, '');
  }

  const windowBase = typeof window !== 'undefined' ? window.__API_BASE__ : '';
  if (typeof windowBase === 'string' && windowBase.trim()) {
    return windowBase.trim().replace(/\/$/, '');
  }

  return 'http://localhost:8000';
};

const normalizeApiBaseForBrowser = (baseUrl) => {
  if (typeof window === 'undefined' || !baseUrl) {
    return baseUrl;
  }

  const isHttpsPage = window.location.protocol === 'https:';
  if (!isHttpsPage || !baseUrl.startsWith('http://')) {
    return baseUrl;
  }

  // HTTPS pages cannot call HTTP APIs in browsers (mixed content), so upgrade URL for deployed demos.
  return `https://${baseUrl.slice('http://'.length)}`;
};

export const API_BASE = normalizeApiBaseForBrowser(resolveApiBase());
