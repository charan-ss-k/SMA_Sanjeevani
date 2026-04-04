const resolveApiBase = () => {
  const viteBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (viteBase) {
    return viteBase.replace(/\/$/, '');
  }

  return 'http://localhost:8000';
};

export const API_BASE = resolveApiBase();
