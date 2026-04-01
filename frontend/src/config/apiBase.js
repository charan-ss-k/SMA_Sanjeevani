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

export const API_BASE = resolveApiBase();
