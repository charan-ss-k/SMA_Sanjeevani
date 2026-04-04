const resolveApiBase = () => {
  const viteBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (viteBase) {
    return viteBase.replace(/\/$/, '');
  }

  // Cloud-first fallback: never fall back to localhost in deployed/dev builds.
  return 'http://98.70.223.78';
};

export const API_BASE = resolveApiBase();
