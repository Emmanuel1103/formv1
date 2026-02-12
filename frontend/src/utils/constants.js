const getApiUrl = () => {
  // Si está definida la variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en Azure Container Apps, detectar automáticamente y forzar HTTPS
  if (window.location.hostname.includes('azurecontainerapps.io')) {
    const hostname = window.location.hostname.replace('-web-', '-api-');
    return `https://${hostname}`; // Forzar HTTPS en Azure
  }
  
  // Por defecto, localhost para desarrollo
  return 'http://localhost:8000';
};

export const config = {
  apiUrl: getApiUrl(),
  allowedDomain: '@fundacionsantodomingo.org',
  tokenExpiry: 30,
  maxFileSize: 1024 * 1024
};
