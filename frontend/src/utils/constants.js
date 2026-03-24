const getApiUrl = () => {
  let url = '';

  // 1. Prioridad a la variable de entorno
  if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL;
  }
  // 2. Detección automática en Azure
  else if (window.location.hostname.includes('azurecontainerapps.io')) {
    const hostname = window.location.hostname.replace('-web-', '-api-');
    url = `https://${hostname}`;
  }
  // 3. Fallback a localhost
  else {
    url = 'https://localhost:8000';
  }

  // VALIDACIÓN CRÍTICA: Forzar HTTPS si es Azure (evita mixed content)
  if (url.includes('azurecontainerapps.io') && url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }

  return url;
};

export const config = {
  apiUrl: getApiUrl(),
  allowedDomain: '@fundacionsantodomingo.org',
  tokenExpiry: 30,
  maxFileSize: 1024 * 1024
};
